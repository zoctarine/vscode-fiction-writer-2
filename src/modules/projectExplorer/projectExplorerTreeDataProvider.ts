import * as vscode from 'vscode';
import * as path from 'path';
import {DisposeManager, FictionWriter, log} from "../../core";
import {
    FactorySwitch,
    FwEmpty,
    FwEmptyVirtualFolder,
    FwFileManager,
    FwItem,
    FwRootItem,
    FwVirtualFolderItem,
    IFwFile
} from '../../core/fwFiles';
import {ContextManager} from '../../core/contextManager';
import {ProjectExplorerTreeItem, ProjectNode, ProjectNodeList} from './projectExplorerTreeItem';
import {ProjectsOptions} from './projectsOptions';
import {IDecorationState, IFileState, StateManager} from '../../core/state';
import {AllFilesFilter, IFileFilter, OnlyProjectFilesFilter} from './fileInfoFilters';
import {FaIcons} from '../../core/decorations';
import {TreeStructure} from '../../core/tree/treeStructure';
import rfdc from 'rfdc';

const clone = rfdc();

const action = {
    none: undefined,
    ordering: 'ordering',
    compiling: 'compiling',
};

export class ProjectExplorerTreeDataProvider
    extends DisposeManager
    implements vscode.TreeDataProvider<ProjectNode>,
        vscode.TreeDragAndDropController<ProjectNode> {
    dropMimeTypes = ['application/vnd.code.tree.projectexplorerview'];
    dragMimeTypes = ['application/vnd.code.tree.projectexplorerview'];
    private _treeView: vscode.TreeView<ProjectNode>;
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectNode | undefined | null | void> = new vscode.EventEmitter<ProjectNode | undefined | null | void>();
    // We want to use an array as the event type, but the API for this is currently being finalized. Until it's finalized, use any.
    public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    public _treeStructure: TreeStructure<IFileState>;
    private _mixFoldersAndFiles = true;
    private _syncWithActiveEditorEnabled = false;
    private _isBatchOrderingEnabled = false;
    private _showDecoration: string;
    private _fileFilter: IFileFilter = OnlyProjectFilesFilter;

    constructor(
        private _options: ProjectsOptions,
        private _fileManager: FwFileManager, private _contextManager: ContextManager, private _stateManager: StateManager) {
        super();
        this._treeStructure = new TreeStructure<IFileState>(new ProjectNode('root', {fwItem: new FwRootItem()}));
        this._treeView = vscode.window.createTreeView(FictionWriter.views.projectExplorer.id, {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            dragAndDropController: this,
            manageCheckboxStateManually: true,
        });

        this.manageDisposable(
            this._treeView,
            this._onDidChangeTreeData,
            this._options.fileDescriptionMetadataKey.onChanged(_ => this.refresh()),
            this._stateManager.onFilesStateChanged(() => {
                this.refresh(); // TODO: Improve this, to not overlap with onFilesChanged
            }),
            this._treeView.onDidCollapseElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, false);
            }),
            this._treeView.onDidExpandElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, true);
            }),
            // TODO(A)
            // this._treeView.onDidChangeCheckboxState(e => {
            //     for (let [node, state] of e.items) {
            //         node.item.checked = state === TreeItemCheckboxState.Checked
            //     }
            // }),
            vscode.window.onDidChangeActiveTextEditor(e => {
                this._handleActiveTextEditorChanged(e);
            })
        );

        this._showDecoration = this._contextManager.get(FictionWriter.views.projectExplorer.show.decorationIs, 'decoration1');
        vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.show.decorationIs, this._showDecoration)
            .then(() => {
                const fileFilter = this._contextManager.get(FictionWriter.views.projectExplorer.filters.is, 'projectFiles');
                vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.filters.is, fileFilter)
                    .then(() => {
                        this._fileFilter = fileFilter === 'projectFiles' ? OnlyProjectFilesFilter : AllFilesFilter;
                        return this.refresh();
                    });
            });
    }

    private async buildVirtualFolders(node: ProjectNode) {
        if (!node) return;

        if (node.children && node.children.length > 0) {
            const possibleParents = new Map<number, ProjectNode>(node.children
                .filter(n => n.data.fwItem?.parentOrder.length === 0)
                .map(c => [c.data.fwItem?.order ?? 0, c]));
            const possibleChildren = node.children
                .filter(n => n.data.fwItem?.parentOrder.length && n.data.fwItem?.parentOrder.length > 0);

            for (const child of possibleChildren) {
                if (!child.data.fwItem) continue;
                const order = child.data.fwItem.parentOrder[0];
                if (order && order > 0 && child.parent) {
                    let parent = possibleParents.get(order);
                    if (!parent) {
                        parent = new ProjectNode(child.parent.id + "/" + order, {fwItem: FwEmptyVirtualFolder.create(child.parent.data.fwItem, order)});
                        this._treeStructure.addChild(parent, child.parent);
                        possibleParents.set(order, parent);
                    }

                    child.data.fwItem!.parentOrder.splice(0, 1);
                    this._treeStructure.detach(child);
                    this._treeStructure.addChild(child, parent);

                    if (parent.data.fwItem) {
                        this._morph(parent.data.fwItem, FwVirtualFolderItem);
                        if (!parent.data.decorations) {
                            parent.data.decorations = {};
                        }

                        // TODO: refactor this
                        const newstate = clone(parent.data);
                        await this._stateManager.processUnmanaged('', newstate);
                        parent.data.decorations = newstate.decorations;
                    }
                }
            }

            for (let child of node.children) {
                await this.buildVirtualFolders(child);
            }
        }
    }

    private _morph(item: FwItem, ctor: new (ref: IFwFile) => FwItem) {
        const instance = new ctor(item.ref);

        item.type = instance.type;
        item.control = instance.control;
        item.subType = instance.subType;
        Object.setPrototypeOf(item, Object.getPrototypeOf(instance));

    }

    private printTree(node: ProjectNode, indent: string) {
        log.tmp(indent + node.id);
        for (const child of node.children) {
            this.printTree(child, indent + "  ");
        }
    }

    private async buildHierarchy(states: IFileState[]) {
        const tree = new TreeStructure<IFileState>(new ProjectNode('root', {fwItem: new FwRootItem()}));
        const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath);
        for (const state of states) {
            if (!state?.fwItem?.ref) continue;
            const {fsPath} = state.fwItem.ref;
            let relativePath = vscode.workspace.asRelativePath(fsPath, true);
            if (workspaceFolders?.includes(relativePath)) continue;

            const segments = relativePath.split(path.posix.sep);
            const basePath = fsPath.substring(0, fsPath.length - relativePath.length);
            let currentLevel = tree.root;
            let currentPath = basePath;
            for (const segment of segments) {
                currentPath = path.posix.join(currentPath, segment);

                let node = tree.getNode(currentPath);
                if (!node) {
                    node = new ProjectNode(
                        currentPath,
                        {
                            fwItem: new FwEmpty(),
                            decorations: {
                                icon: FaIcons.inbox
                            }
                        });
                    tree.addChild(node, currentLevel);
                }
                currentLevel = node;
            }

            currentLevel.data = state;
            currentLevel.visible = this._fileFilter.check(state.fwItem);
        }

        this._treeStructure = tree;

        await this.buildVirtualFolders(tree.root);

        //  this.printTree(tree.root, "");
        // // sort results in order by id
        // fwItems.sort((a, b) => a.ref.fsPath > b.ref.fsPath ? 1 : a.ref.fsPath === b.ref.fsPath ? 0 : -1);
        //
        // const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => asPosix(f.uri.fsPath)) ?? [];
        // fwItems.forEach((item) => {
        //     if (workspaceFolders.includes(item.ref.fsPath)) return;
        //
        //     const isVisible = this._fileFilter.check(item);
        //     const relativePath = vscode.workspace.asRelativePath(item.ref.fsPath, false);
        //
        //     let basePath = item.ref.fsPath.replace(relativePath, "");
        //
        //     log.tmp("LOG", { isVisible, relativePath, basePath, workspaceFolders });
        //
        //     const segments = relativePath.split(path.posix.sep).filter(Boolean); // Split path into segments and remove any empty segments
        //     let current = this._tree.root;
        //     current.item.fsName = basePath;
        //     current.id = basePath;
        //
        //     segments.forEach((segment, index) => {
        //         let childAdded = false;
        //         const tmpId = path.posix.join(current.id, segment);
        //
        //         if (!current.children?.has(tmpId)) {
        //             const isLeaf = index === segments.length - 1;
        //             if (!isLeaf) basePath = path.posix.join(basePath, segment);
        //             let node: ProjectNode = new ProjectFileNode(tmpId);
        //             if (!isLeaf && workspaceFolders.includes(basePath)) {
        //                 node = new WorkspaceFolderNode(tmpId);
        //                 node.item.description = '/';
        //                 node.item.name = segment;
        //             } else if (!isLeaf) {
        //                 node = new FolderNode(tmpId);
        //                 node.item.description = 'folder';
        //                 node.item.name = segment;
        //             } else if (isLeaf) {
        //                 if (item.type === FwType.Folder) {
        //                     node = new FolderNode(tmpId);
        //                     node.item.name = item.ref.name;
        //                     node.item.ext = item.ref.ext;
        //                 } else {
        //                     if (item.control === FwControl.Active) {
        //                         node = new ProjectFileNode(tmpId);
        //                     } else if (item.control === FwControl.Possible) {
        //                         node = new TextFileNode(tmpId);
        //                     } else {
        //                         node = new OtherFileNode(tmpId);
        //                     }
        //                     node.item.name += node.item.ext;
        //                     node.item.ext = item.ref.ext;
        //                     node.item.name = item.ref.name;
        //                 }
        //                 const state = this._stateManager.get(item.ref.fsPath);
        //
        //                 if (state?.decoration && (!this._showDecoration || this._showDecoration === 'decoration1' || this._showDecoration === 'decoration2')) {
        //                     node.item.icon = state.decoration.icon ?? node.item.icon;
        //                     node.item.color = state.decoration.color ?? node.item.color;
        //                     node.item.description = state.decoration.description ?? node.item.description;
        //                 }
        //                 if (state?.metadata?.value && this._options.fileDescriptionMetadataKey.value) {
        //                     node.item.description = state.metadata.value[this._options.fileDescriptionMetadataKey.value]?.toString();
        //                 }
        //                 if (!this._showDecoration || this._showDecoration === 'decoration1' || this._showDecoration === 'decoration3') {
        //                     if (this._showDecoration && this._showDecoration === 'decoration3') {
        //                         const decoration = state?.textStatisticsDecorations;
        //                         if (decoration) {
        //                             node.item.description = decoration.description ?? node.item.description;
        //                         }
        //                     }
        //                     const decoration = state?.writeTargetsDecorations;
        //                     if (decoration) {
        //                         node.item.icon = decoration.icon ?? node.item.icon;
        //                         node.item.color = decoration.color ?? node.item.color;
        //                         node.item.description = decoration.description ?? node.item.description;
        //                     }
        //                 }
        //             }
        //             node.isVisible = isVisible;
        //             node.parent = current;
        //             node.item.order = item.order;
        //             node.item.fsName = segment;
        //             if (!childAdded) {
        //                 current.children?.set(node.id, node);
        //             }
        //         }
        //         current = current.children?.get(tmpId) as ProjectNode;
        //     });
        //
        //     if (item.parentOrder.length > 0 && current.type === NodeType.File) {
        //         let cursor = current.parent;
        //
        //         item.parentOrder.forEach((order, index) => {
        //             if (!cursor) return;
        //
        //             let node = [...cursor.children?.values() ?? []].find(a => a.item.order === order && a.type === NodeType.File);
        //             if (!node) {
        //                 const parentOrders = item.parentOrder.slice(0, index + 1).map(a => FwFile.toOrderString(a));
        //                 const name = path.posix.join(item.ref.fsDir, parentOrders.join('') + ` new${item.ref.ext}`);
        //                 node = new ProjectFileNode(name);
        //                 node.parent = cursor;
        //                 node.item.name = "[missing file]";
        //                 node.item.description = "";
        //                 node.item.order = order;
        //                 node.item.fsName = "";
        //                 cursor?.children?.set(node.id, node);
        //             }
        //
        //             cursor = node;
        //             if (cursor) {
        //                 VirtualFolderNode.applyTo(cursor as ProjectNode);
        //             }
        //         });
        //
        //         current?.parent?.children?.delete(current.id);
        //         current.parent = cursor;
        //         cursor?.children?.set(current.id, current);
        //     }
        //
        // });
    }

    public getParent(element: ProjectNode): ProjectNode | undefined {
        return element.parent;
    }

    public getChildren(element: ProjectNode): ProjectNode[] {

        const children = (element
                ? this._treeStructure.getNode(element.id)?.children
                : this._treeStructure.getRoot().children)
            ?? [];

        return new ProjectNodeList(children)
            .filter()
            .sort()
            .items;
    }


    public getTreeItem(element: ProjectNode): vscode.TreeItem {
        const node = this._treeStructure.getNode(element.id);
        if (!node) return {};

        return new ProjectExplorerTreeItem(node, {
            expanded: this._contextManager.get("tree_expanded_" + element.id, false),
            decorationsSelector: (s) =>
                new FactorySwitch<(IDecorationState | undefined)[]>()
                    .case(this._showDecoration === 'decoration1', () => [s.writeTargetsDecorations, s.metadataDecorations])
                    .case(this._showDecoration === 'decoration2', () => [s.metadataDecorations])
                    .case(this._showDecoration === 'decoration3', () => [s.textStatisticsDecorations, s.writeTargetsDecorations])
                    .case(this._showDecoration === 'decoration4', () => [])
                    .create()
        });
        // const item = element.asTreeItem();
        // item.description = `${this._isBatchOrderingEnabled ? `(${element.item.order}) ` : ''}${element.item.description ?? ''}`,
        //     item.collapsibleState = item.collapsibleState === vscode.TreeItemCollapsibleState.None
        //         ? vscode.TreeItemCollapsibleState.None
        //         : expanded
        //             ? vscode.TreeItemCollapsibleState.Expanded
        //             : vscode.TreeItemCollapsibleState.Collapsed;
        //
        // if (element.item.checked === true) {
        //     item.checkboxState = vscode.TreeItemCheckboxState.Checked;
        // } else if (element.item.checked === false) {
        //     item.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
        // } else {
        //     item.checkboxState = undefined;
        // }
        // return item;
    }

    public makeVirtualFolder(node: ProjectNode): void {
        // if (node.type === FwSubType.ProjectFile) {
        //     VirtualFolderNode.applyTo(node);
        //     this._onDidChangeTreeData.fire();
        // } else if (node.type === FwSubType.VirtualFolder) {
        //     if (node.children?.size === 0) {
        //         node.type = FwSubType.ProjectFile;
        //         this._onDidChangeTreeData.fire();
        //     } else {
        //         vscode.window.showInformationMessage("Cannot break a virtual folder with children", {
        //             modal: true
        //         });
        //     }
        // }
    }

    public addFile(node: ProjectNode): void {
        //  this._addNewChild(node ?? this._treeView.selection[0], FwSubType.ProjectFile);
    }

    public addFolder(node: ProjectNode): void {
        //   this._addNewChild(node ?? this._treeView.selection[0], FwSubType.Folder);
    }

    public rename(node: ProjectNode): void {
        // node = node ?? this._treeView.selection[0];
        // if (node) {
        //     vscode.window.showInputBox({prompt: 'Enter new name', value: node.item.name}).then((value) => {
        //         if (value) {
        //             node.item.name = value;
        //             this._fileManager.renameFile(node.id, node.buildFsPath()).then(() => {
        //             }).catch(err => console.warn(err));
        //         }
        //     });
        // }
    }

    public delete(node: ProjectNode): void {
        // node = node ?? this._treeView.selection[0];
        //
        // if (node) {
        //     this._fileManager.deleteFile(node.id);
        // }
    }

    // private _addNewChild(node: ProjectNode | undefined, type: FwSubType = FwSubType.ProjectFile): void {
    //     if (!node) return;
    //     const newNode = new ProjectNode('new' + Math.random(), new ProjectItem());
    //     newNode.type = type;
    //     newNode.item.name = "new";
    //     newNode.item.ext = this._options.trackingTag.value ? `.${this._options.trackingTag.value}` : '';
    //     if (type === FwSubType.ProjectFile) {
    //         newNode.item.ext += '.md';
    //     }
    //
    //     this._insert(newNode, node);
    //     newNode.id = newNode.buildFsPath();
    //     newNode.item.fsName = newNode.item.buildFsName();
    //     this._treeView.reveal(newNode, {select: true, focus: true, expand: true});
    //     if (type === FwSubType.Folder) {
    //         vscode.workspace.fs.createDirectory(vscode.Uri.parse(newNode.id))
    //             .then(() => {
    //                 this.refresh();
    //             });
    //     } else {
    //         vscode.workspace.fs.writeFile(vscode.Uri.parse(newNode.id), new Uint8Array(0))
    //             .then(() => {
    //                 this.refresh();
    //             });
    //     }
    // }

    private _tryMoveToChildren(source: ProjectNode, dest?: ProjectNode): boolean {
        // TODO
        // if (!source?.isDraggable) return false; // cannot move the root
        // if (!dest?.parent) return false;  // cannot move a file to
        // if (dest.id.startsWith(source.id)) return false; // cannot move into itself
        //
        // if (source.parent !== dest && dest.acceptsChild(source)) {     // move to a different parent
        //     source.parent?.children?.delete(source.id);
        //     source.parent = dest;
        //     dest.children?.set(source.id, source);
        // }

        return true;
    }

    // Drag and drop controller
    public async handleDrop(target: ProjectNode | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        if (token.isCancellationRequested) return;
        //TODO
        // const transferItem = sources.get('application/vnd.code.tree.projectexplorerview');
        // if (!transferItem) return; // nothing to drop
        // const source = this._tree.getNode(transferItem.value[0]?.id ?? "");
        // const dest = this._tree.getNode(target?.id ?? "");
        // this._insert(source, dest);


        // if (!this._isBatchOrderingEnabled) {
        //     this.commit();
        // }
    }

    // TODO
    // private _insert(source?: ProjectNode, dest?: ProjectNode) {
    //     if (!source || !dest) return; // don't know what to move where
    //     if (!source.isDraggable) return; // cannot move
    //     if (source === dest) return; // no need to move
    //
    //     // find first acceptable position
    //     if (dest.acceptsChild(source)) {
    //         if (!this._tryMoveToChildren(source, dest)) return;
    //     } else {
    //         if (!this._tryMoveToChildren(source, dest.parent as ProjectNode | undefined)) return;
    //     }
    //
    //     // Reorder source siblings (wherever it ended up)
    //     const items = this._mixFoldersAndFiles
    //         ? this._tree.getSiblings(source)
    //         : this._tree.getMatchingSiblings(source);
    //     const siblings = items
    //         .map(a => ({id: a.id, order: a.item.order}))
    //         .sort((a, b) => a.order - b.order);
    //
    //     new OrderHandler(siblings)
    //         .reorder(source.id, dest?.id ?? "")
    //         .get()
    //         .forEach(e => {
    //             const item = this._tree.getNode(e.id);
    //             if (item) {
    //                 item.item.order = e.order;
    //             }
    //         });
    //
    //     this._onDidChangeTreeData.fire();
    // }

    public reorderAll() {
        // this._reorderAll(this._tree.root);
        // this.commit();
        // //   this._onDidChangeTreeData.fire();

    }

    public _reorderAll(root: ProjectNode) {
        // const siblings = [...root.children?.values() ?? []]
        //     .map(a => ({id: a.id, order: a.item.order}));
        // let list: string[] = [];
        // new OrderHandler(siblings)
        //     .redistributeAll()
        //     .get()
        //     .forEach(e => {
        //         const item = this._tree.getNode(e.id);
        //         list.push(`${e.id} ${e.order}`);
        //         if (item) {
        //             item.item.order = e.order;
        //         } else {
        //             console.log(`Cannot find ${e.id}`);
        //         }
        //     });
        // console.log(list);
        // root.children?.forEach(child => {
        //     this._reorderAll(child as ProjectNode);
        // });
    }


    public enableOrdering() {
        vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.is, action.ordering)
            .then(() => {
                this._isBatchOrderingEnabled = true;
                this._treeView.description = "Reordering";
                return this.refresh();
            });
    }

    public async disableOrdering(discardChanges: boolean = true) {
        await vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.is, action.none);

        this._isBatchOrderingEnabled = false;
        this._treeView.description = "";
        if (discardChanges) return this.refresh();
    }

    public async commitOrdering() {
        await this.disableOrdering(false);
        this.commit();
    }

    public async redistribute(node: ProjectNode) {
        // if (node?.children?.size) {
        //     let idx = 1;
        //     for (let child of node.children.values()) {
        //         if (child.item) child.item.order = idx++;
        //     }
        //     this._onDidChangeTreeData.fire();
        // }
    }

    public showNextFor(decoration: string) {
        const decorations = ['decoration1', 'decoration2', 'decoration3', 'decoration4'];
        const crt = decorations.indexOf(decoration);
        let next = 0;
        if (crt >= 0) {
            next = (crt + 1) % decorations.length;
        }
        vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.show.decorationIs, decorations[next])
            .then(() => {
                this._showDecoration = decorations[next];
                this.refresh();
                return this._contextManager.set(FictionWriter.views.projectExplorer.show.decorationIs, this._showDecoration);
            });
    }

    public syncWithActiveEditorOn() {
        vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.sync.isOn, true);
        this._syncWithActiveEditorEnabled = true;
        this._handleActiveTextEditorChanged(vscode.window.activeTextEditor);
    }

    public syncWithActiveEditorOff() {
        vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.sync.isOn, false);
        this._syncWithActiveEditorEnabled = false;
    }

    public async handleDrag(source: ProjectNode[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        // if (!source[0]?.isDraggable) return;
        // if (!this._isBatchOrderingEnabled) return;
        // treeDataTransfer.set('application/vnd.code.tree.projectexplorerview', new vscode.DataTransferItem(source));
    }


    public refresh() {
        const fwItems = this._stateManager.trackedFiles.filter(a => a !== undefined);
        this._treeStructure.clear();
        this.buildHierarchy(fwItems)
            .then(() => this._onDidChangeTreeData.fire(),
                (err) => log.error("Error while building hierarchy", err));
    }

    public commit(): void {
        // const files = this._tree.toList();
        // const renameMap: { oldPath: string, newPath: string }[] = [];
        //
        // files.forEach(f => {
        //     if (!f.isDraggable) return;
        //     if (!f.item.fsName) return;
        //     const oldPath = f.id;
        //     const newPath = f.buildFsPath(1);
        //     if (oldPath !== newPath) {
        //         renameMap.push({oldPath, newPath});
        //     }
        // });
        //
        // if (renameMap.length > 1) {
        //     vscode.window.showInformationMessage(`Renaming ${renameMap.length} files...`,
        //         {modal: true}, 'OK').then(async (result) => {
        //         if (result === 'OK') {
        //             await this._fileManager.batchRenameFiles(renameMap);
        //         }
        //         await this.refresh();
        //     });
        // } else if (renameMap.length === 1) {
        //     this._fileManager.batchRenameFiles(renameMap).then(() => this.refresh());
        // } else {
        //     this.refresh();
        // }

    }

    private _handleActiveTextEditorChanged(e: vscode.TextEditor | undefined) {
        if (!this._syncWithActiveEditorEnabled || !e) return;
        this.reveal(e.document.uri.fsPath);
    }

    public async reveal(fsPath: string, force = false) {
        const element = this._treeStructure.getNode(fsPath);

        if (element) {
            const revealOptions = {
                select: true,
                expand: true,
                focus: false
            };

            if (force) {
                try {
                    await vscode.commands.executeCommand(`${FictionWriter.views.projectExplorer.id}.focus`);
                } catch (err) {
                    log.error("Err", err);
                }
            }

            if (element.visible) {
                await this._treeView.reveal(element, revealOptions);
            } else {
                await this.filter(AllFilesFilter);
                // revealOptions.focus = true;
                await this._treeView.reveal(element, revealOptions);
            }

            // TODO: decide if need to highlight
            // if (force) {
            //     setTimeout(() => {
            //         element.item.highlight = true;
            //         this._onDidChangeTreeData.fire(element);
            //         setTimeout(() => {
            //             element.item.highlight = false;
            //             this._onDidChangeTreeData.fire(element);
            //         }, 1000);
            //     }, 100);
            // }
        }
    }

    public startSelection(e: ProjectNode) {
        // const node = this._tree.getNode(e.id);
        // if (node) {
        //     vscode.commands.executeCommand('setContext',
        //             FictionWriter.views.projectExplorer.is, action.compiling)
        //         .then(() => {
        //             this._tree.toList().forEach(f => {
        //                 if (f.item.checked === undefined) {
        //                     f.item.checked = false;
        //                 }
        //             });
        //             this._treeView.description = "Compile";
        //
        //             this._updateCheckboxBasedOnMeta(node);
        //             this._onDidChangeTreeData.fire();
        //         });
        // }
    }

    public retrieveSelection(): string[] {
        // this.discardSelection();
        // return this._tree.toList()
        //     .filter(l => l.item.checked && l.hasTextContent)
        //     .map(l => l.id);
        return [];
    }

    public discardSelection() {
        // vscode.commands.executeCommand('setContext',
        //         FictionWriter.views.projectExplorer.is, action.none)
        //     .then(() => {
        //         this._tree.toList().forEach(f => {
        //             f.item.checked = undefined;
        //         });
        //         this._treeView.description = undefined;
        //
        //         this._onDidChangeTreeData.fire();
        //     });
    }

    public async filter(filter: string | IFileFilter) {

        if (typeof filter === 'string') {
            switch (filter) {
                case OnlyProjectFilesFilter.key:
                    this._fileFilter = OnlyProjectFilesFilter;
                    break;
                case AllFilesFilter.key:
                    this._fileFilter = AllFilesFilter;
                    break;
            }
        } else {
            this._fileFilter = filter;
        }

        await this._contextManager.set(
            FictionWriter.views.projectExplorer.filters.is,
            this._fileFilter.key);

        await vscode.commands.executeCommand('setContext',
            FictionWriter.views.projectExplorer.filters.is,
            this._fileFilter.key);

        return this.refresh();
    }

    private _updateCheckboxBasedOnMeta(root: ProjectNode) {
        root.selected = this._stateManager.get(root.id)?.metadata?.value?.compile !== 'exclude';
        root.children?.forEach(c => this._updateCheckboxBasedOnMeta(c as ProjectNode));
    }

}

interface IFileOrderFormat {
    format(order: number): string;
}

class NumberDotFileOrderFormat implements IFileOrderFormat {
    public static regex: RegExp = /^(\d+\.)* (.*)/i;

    constructor(private _pad: number) {
    }

    format(order: number): string {
        return order.toString().padStart(this._pad, '0') + '.';
    }
}