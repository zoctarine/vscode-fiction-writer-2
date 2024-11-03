import * as vscode from 'vscode';
import * as path from 'path';
import {DisposeManager, FictionWriter, FwProjectFileItem, FwSubType, log} from "../../core";
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
import {ProjectExplorerTreeItem} from './projectExplorerTreeItem';
import {ProjectsOptions} from './projectsOptions';
import {IDecorationState, IFileState, StateManager} from '../../core/state';
import {AllFilesFilter, IFileFilter, OnlyProjectFilesFilter} from './fileInfoFilters';
import {FaIcons} from '../../core/decorations';
import {TreeStructure} from '../../core/tree/treeStructure';
import rfdc from 'rfdc';
import {ProjectNode, ProjectNodeList} from './projectNode';

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
                        this._morph(parent, parent.data.fwItem.ref.fsExists
                            ? FwVirtualFolderItem
                            : FwEmptyVirtualFolder);

                    }
                }
            }

            for (let child of node.children) {
                await this.buildVirtualFolders(child);
            }
        }
    }

    private async _morph(node: ProjectNode, ctor: { new(ref: IFwFile): FwItem }) {
        const {data:{fwItem}} = node;
        if (!fwItem) return;

        const instance = new ctor(fwItem.ref);
        fwItem.type = instance.type;
        fwItem.control = instance.control;
        fwItem.subType = instance.subType;
        Object.setPrototypeOf(fwItem, Object.getPrototypeOf(instance));

        if (!node.data.decorations) {
            node.data.decorations = {};
        }

        // TODO: refactor this
        const newstate = clone(node.data);
        await this._stateManager.processUnmanaged('', newstate);
        node.data.decorations = newstate.decorations;
    }

    private arrangeWorkspaces() {
        const workspaces: ProjectNode[] = [];
        const collectWorkspaces = (node: ProjectNode, workspaces: ProjectNode[]) => {
            if (node.data.fwItem?.subType === FwSubType.WorkspaceFolder) {
                workspaces.push(node);
            } else if (node.children?.length > 0) {
                for (const child of node.children) {
                    collectWorkspaces(child, workspaces);
                }
            }

        };

        const root = this._treeStructure.root;
        collectWorkspaces(root, workspaces);

        root.children.forEach((child) => {
            this._treeStructure.detach(child);
        });
        for (const child of workspaces) {
            this._treeStructure.addChild(child, root);
        }
    }

    private printTree(node: ProjectNode, indent: string) {
        log.tmp(indent + node.id);
        for (const child of node.children) {
            this.printTree(child, indent + "  ");
        }
    }

    private async buildHierarchy(states: IFileState[]) {
        const tree = new TreeStructure<IFileState>(new ProjectNode('root', {fwItem: new FwRootItem()}));
        const workspaces: ProjectNode[] = [];
        for (const state of states) {
            if (!state?.fwItem?.ref) continue;
            const {fsPath} = state.fwItem.ref;
            const segments = fsPath.split(path.posix.sep);
            let currentLevel = tree.root;
            let currentPath = '/';
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
            if (currentLevel.data.fwItem?.subType === FwSubType.WorkspaceFolder) {
                workspaces.push(currentLevel);
            }
        }

        this._treeStructure = tree;

        // TODO: optimize workspace folder filtering) and virtual folder building
        //       should be more efficient for larger implementation. (current draft)
        this.arrangeWorkspaces();
        await this.buildVirtualFolders(tree.root);
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
    }

    public async toggleVirtualFolder(node: ProjectNode): Promise<void> {
        if (node.data.fwItem?.subType === FwSubType.ProjectFile) {
           await  this._morph(node, FwVirtualFolderItem);
            this._onDidChangeTreeData.fire();
        } else if (node.data.fwItem?.subType === FwSubType.VirtualFolder) {
            if (node.children?.length === 0) {
                await this._morph(node, FwProjectFileItem);
                this._onDidChangeTreeData.fire();
            } else {
                vscode.window.showInformationMessage("Cannot break a virtual folder with children", {
                    modal: true
                });
            }
        }
    }

    public addFile(node: ProjectNode): void {
        //  this._addNewChild(node ?? this._treeView.selection[0], FwSubType.ProjectFile);
    }

    public addFolder(node: ProjectNode): void {
        //   this._addNewChild(node ?? this._treeView.selection[0], FwSubType.Folder);
    }

    public rename({data: {fwItem}}: ProjectNode): void {
        if (fwItem) {
            const {ref} = fwItem;
            vscode.window.showInputBox({prompt: 'Enter new name', value: ref.name})
                .then((value) => {
                    if (value) {
                        this._fileManager.renameFile(
                            ref.fsPath,
                            path.posix.join(ref.fsDir, value + ref.ext)).then(() => {
                        }).catch(err => console.warn(err));
                    }
                });
        }
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