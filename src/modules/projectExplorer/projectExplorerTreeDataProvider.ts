import * as vscode from 'vscode';
import {TreeItemCheckboxState} from 'vscode';
import * as path from 'path';
import {OrderHandler} from "./orderHandler";
import {DisposeManager, FictionWriter, log} from "../../core";
import {NodeType} from './nodeType';
import {NodeTree} from '../../core/tree';
import {asPosix, FwControl, FwFile, FwFileInfo, FwFileManager, FwType} from '../../core/fwFiles';
import {ContextManager} from '../../core/contextManager';
import {
    FolderNode,
    OtherFileNode,
    ProjectFileNode,
    ProjectNode,
    RootNode,
    TextFileNode,
    WorkspaceFolderNode
} from './projectNodes';
import {ProjectItem} from './projectItem';
import {ProjectsOptions} from './projectsOptions';
import {StateManager} from '../../core/state';
import {AllFilesFilter, IFileFilter, OnlyProjectFilesFilter} from './fileInfoFilters';

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
    public _tree: NodeTree<ProjectNode>;
    private _mixFoldersAndFiles = true;
    private _syncWithActiveEditorEnabled = false;
    private _isBatchOrderingEnabled = false;
    private _showDecoration: string;
    private _fileFilter: IFileFilter = OnlyProjectFilesFilter;

    constructor(
        private _options: ProjectsOptions,
        private _fileManager: FwFileManager, private _contextManager: ContextManager, private _stateManager: StateManager) {
        super();
        this._tree = new NodeTree<ProjectNode>(new RootNode());
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
            this._options.fileDescriptionMetadataKey.onChanged(_ => this.reload()),
            this._stateManager.onFilesStateChanged(() => {
                this.reload(); // TODO: Improve this, to not overlap with onFilesChanged
            }),
            // this._fileManager.onFilesChanged((files) => {
            //     this._refreshTree(files);
            // }),
            this._treeView.onDidCollapseElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, false);
            }),
            this._treeView.onDidExpandElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, true);
            }),
            this._treeView.onDidChangeCheckboxState(e => {
                for (let [node, state] of e.items) {
                    node.item.checked = state === TreeItemCheckboxState.Checked
                }
            }),
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
                        return this.reload();
                    });
            });
    }

    private buildHierarchy(fileInfos: FwFileInfo[]): ProjectNode {
        // sort results in order by id
        fileInfos.sort((a, b) => a.fsPath > b.fsPath ? 1 : a.fsPath === b.fsPath ? 0 : -1);

        const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => asPosix(f.uri.fsPath)) ?? [];
        fileInfos.forEach((fileInfo) => {
            if (workspaceFolders.includes(fileInfo.fsPath)) return;

            const isVisible = this._fileFilter.check(fileInfo);

            const relativePath = vscode.workspace.asRelativePath(fileInfo.fsPath, true);

            let basePath = fileInfo.fsPath.replace(relativePath, "");

            const segments = relativePath.split(path.posix.sep).filter(Boolean); // Split path into segments and remove any empty segments
            let current = this._tree.root;
            current.item.fsName = basePath;
            current.id = basePath;

            segments.forEach((segment, index) => {
                let childAdded = false;
                const tmpId = path.posix.join(current.id, segment);

                if (!current.children?.has(tmpId)) {
                    const isLeaf = index === segments.length - 1;
                    if (!isLeaf) basePath = path.posix.join(basePath, segment);
                    let node: ProjectNode = new ProjectFileNode(tmpId);

                    if (!isLeaf && workspaceFolders.includes(basePath)) {
                        node = new WorkspaceFolderNode(tmpId);
                        node.item.description = '/';
                        node.item.name = segment;
                    } else if (!isLeaf) {
                        node = new FolderNode(tmpId);
                        node.item.description = 'folder';
                        node.item.name = segment;
                    } else if (isLeaf) {
                        if (fileInfo.type === FwType.Folder) {
                            node = new FolderNode(tmpId);
                            node.item.name = fileInfo.name;
                            node.item.ext = fileInfo.ext;
                        } else {
                            if (fileInfo.control === FwControl.Active) {
                                node = new ProjectFileNode(tmpId);
                            } else if (fileInfo.control === FwControl.Possible) {
                                node = new TextFileNode(tmpId);
                            } else {
                                node = new OtherFileNode(tmpId);
                            }
                            node.item.name += node.item.ext;
                            node.item.ext = fileInfo.ext;
                            node.item.name = fileInfo.name;
                        }
                        const state = this._stateManager.get(fileInfo.fsPath);

                        if (state?.decoration && (!this._showDecoration || this._showDecoration === 'decoration1' || this._showDecoration === 'decoration2')) {
                            node.item.icon = state.decoration.icon ?? node.item.icon;
                            node.item.color = state.decoration.color ?? node.item.color;
                            node.item.description = state.decoration.description ?? node.item.description;
                        }
                        if (state?.metadata?.value && this._options.fileDescriptionMetadataKey.value) {
                            node.item.description = state.metadata.value[this._options.fileDescriptionMetadataKey.value]?.toString();
                        }
                        if (!this._showDecoration || this._showDecoration === 'decoration1' || this._showDecoration === 'decoration3') {
                            if (this._showDecoration && this._showDecoration === 'decoration3') {
                                const decoration = state?.textStatisticsDecorations;
                                if (decoration) {
                                    node.item.description = decoration.description ?? node.item.description;
                                }
                            }
                            const decoration = state?.writeTargetsDecorations;
                            if (decoration) {
                                node.item.icon = decoration.icon ?? node.item.icon;
                                node.item.color = decoration.color ?? node.item.color;
                                node.item.description = decoration.description ?? node.item.description;
                            }
                        }
                    }
                    node.isVisible = isVisible;
                    node.parent = current;
                    node.item.order = fileInfo.order;
                    node.item.fsName = segment;
                    if (!childAdded) {
                        current.children?.set(node.id, node);
                    }
                }
                current = current.children?.get(tmpId) as ProjectNode;
            });

            if (fileInfo.parentOrder.length > 0 && current.type === NodeType.File) {
                let cursor = current.parent;

                fileInfo.parentOrder.forEach((order, index) => {
                    if (!cursor) return;

                    let node = [...cursor.children?.values() ?? []].find(a => a.item.order === order);
                    if (!node) {
                        const parentOrders = fileInfo.parentOrder.slice(0, index + 1).map(a => FwFile.toOrderString(a));
                        const name = path.posix.join(fileInfo.location, parentOrders.join('') + ` new${fileInfo.ext}`);
                        node = new ProjectFileNode(name);
                        node.parent = cursor;
                        node.item.name = " ";
                        node.item.description = "[missing file]";
                        node.item.order = order;
                        node.item.fsName = "";
                        cursor?.children?.set(node.id, node);
                    }

                    cursor = node;
                    if (cursor) {
                        //   cursor.convertTo(VirtualFolderNode);
                        cursor.type = NodeType.VirtualFolder;
                    }
                });

                current?.parent?.children?.delete(current.id);
                current.parent = cursor;
                cursor?.children?.set(current.id, current);
            }



        });
        return this._tree.root;
    }

    public getParent(element: ProjectNode): ProjectNode | undefined {
        return element.parent as ProjectNode;
    }

    // Tree data provider
    public getChildren(element: ProjectNode): ProjectNode[] {
        return this._tree
            .getChildren(element ? element.id : undefined)
            .filter(e => e.isVisible);
    }

    public getTreeItem(element: ProjectNode): vscode.TreeItem {

        const expanded = this._contextManager.get("tree_expanded_" + element.id, false);
        const item = element.asTreeItem();
        item.description = `${this._isBatchOrderingEnabled ? `(${element.item.order}) ` : ''}${element.item.description ?? ''}`,
            item.collapsibleState = item.collapsibleState === vscode.TreeItemCollapsibleState.None
                ? vscode.TreeItemCollapsibleState.None
                : expanded
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.Collapsed;

        if (element.item.checked === true) {
            item.checkboxState = vscode.TreeItemCheckboxState.Checked;
        } else if (element.item.checked === false) {
            item.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
        } else {
            item.checkboxState = undefined;
        }
        return item;
    }

    public makeVirtualFolder(node: ProjectNode): void {
        if (node.type === NodeType.File) {
            node.type = NodeType.VirtualFolder;
            this._onDidChangeTreeData.fire();
        } else if (node.type === NodeType.VirtualFolder) {
            if (node.children?.size === 0) {
                node.type = NodeType.File;
                this._onDidChangeTreeData.fire();
            } else {
                vscode.window.showInformationMessage("Cannot break a virtual folder with children", {
                    modal: true
                });
            }
        }
    }

    public addFile(node: ProjectNode): void {
        this._addNewChild(node ?? this._treeView.selection[0], NodeType.File);
    }

    public addFolder(node: ProjectNode): void {
        this._addNewChild(node ?? this._treeView.selection[0], NodeType.Folder);
    }

    public rename(node: ProjectNode): void {
        node = node ?? this._treeView.selection[0];
        if (node) {
            vscode.window.showInputBox({prompt: 'Enter new name', value: node.item.name}).then((value) => {
                if (value) {
                    node.item.name = value;
                    this._fileManager.renameFile(node.id, node.buildFsPath()).then(() => {
                    }).catch(err => console.warn(err));
                }
            });
        }
    }

    public delete(node: ProjectNode): void {
        node = node ?? this._treeView.selection[0];

        if (node) {
            this._fileManager.deleteFile(node.id);
        }
    }

    private _addNewChild(node: ProjectNode | undefined, type: NodeType = NodeType.File): void {
        if (!node) return;
        const newNode = new ProjectNode('new' + Math.random(), new ProjectItem());
        newNode.type = type;
        newNode.item.name = "new";
        newNode.item.ext = this._options.trackingTag.value ? `.${this._options.trackingTag.value}` : '';
        if (type === NodeType.File) {
            newNode.item.ext += '.md';
        }

        this._insert(newNode, node);
        newNode.id = newNode.buildFsPath();
        newNode.item.fsName = newNode.item.buildFsName();
        this._treeView.reveal(newNode, {select: true, focus: true, expand: true});
        if (type === NodeType.Folder) {
            vscode.workspace.fs.createDirectory(vscode.Uri.parse(newNode.id))
                .then(() => {
                    this.reload();
                });
        } else {
            vscode.workspace.fs.writeFile(vscode.Uri.parse(newNode.id), new Uint8Array(0))
                .then(() => {
                    this.reload();
                });
        }
    }

    private _tryMoveToChildren(source: ProjectNode, dest?: ProjectNode): boolean {
        if (!source?.isDraggable) return false; // cannot move the root
        if (!dest?.parent) return false;  // cannot move a file to
        if (dest.id.startsWith(source.id)) return false; // cannot move into itself

        if (source.parent !== dest && dest.acceptsChild(source)) {     // move to a different parent
            source.parent?.children?.delete(source.id);
            source.parent = dest;
            dest.children?.set(source.id, source);
        }

        return true;
    }

    // Drag and drop controller
    public async handleDrop(target: ProjectNode | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        if (token.isCancellationRequested) return;

        const transferItem = sources.get('application/vnd.code.tree.projectexplorerview');
        if (!transferItem) return; // nothing to drop
        const source = this._tree.getNode(transferItem.value[0]?.id ?? "");
        const dest = this._tree.getNode(target?.id ?? "");
        this._insert(source, dest);
        // if (!this._isBatchOrderingEnabled) {
        //     this.commit();
        // }
    }

    private _insert(source?: ProjectNode, dest?: ProjectNode) {
        if (!source || !dest) return; // don't know what to move where
        if (!source.isDraggable) return; // cannot move
        if (source === dest) return; // no need to move

        // find first acceptable position
        if (dest.acceptsChild(source)) {
            if (!this._tryMoveToChildren(source, dest)) return;
        } else {
            if (!this._tryMoveToChildren(source, dest.parent as ProjectNode | undefined)) return;
        }

        // Reorder source siblings (wherever it ended up)
        const items = this._mixFoldersAndFiles
            ? this._tree.getSiblings(source)
            : this._tree.getMatchingSiblings(source);
        const siblings = items
            .map(a => ({id: a.id, order: a.item.order}))
            .sort((a, b) => a.order - b.order);

        new OrderHandler(siblings)
            .reorder(source.id, dest?.id ?? "")
            .get()
            .forEach(e => {
                const item = this._tree.getNode(e.id);
                if (item) {
                    item.item.order = e.order;
                }
            });

        this._onDidChangeTreeData.fire();
    }

    public reorderAll() {
        this._reorderAll(this._tree.root);
        this.commit();
        //   this._onDidChangeTreeData.fire();

    }

    public _reorderAll(root: ProjectNode) {
        const siblings = [...root.children?.values() ?? []]
            .map(a => ({id: a.id, order: a.item.order}));
        let list: string[] = [];
        new OrderHandler(siblings)
            .redistributeAll()
            .get()
            .forEach(e => {
                const item = this._tree.getNode(e.id);
                list.push(`${e.id} ${e.order}`);
                if (item) {
                    item.item.order = e.order;
                } else {
                    console.log(`Cannot find ${e.id}`);
                }
            });
        console.log(list);
        root.children?.forEach(child => {
            this._reorderAll(child as ProjectNode);
        });
    }


    public enableOrdering() {
        vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.is, action.ordering)
            .then(() => {
                this._isBatchOrderingEnabled = true;
                this._treeView.description = "Reordering";
                return this.reload();
            });
    }

    public async disableOrdering(discardChanges: boolean = true) {
        await vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.is, action.none);

        this._isBatchOrderingEnabled = false;
        this._treeView.description = "";
        if (discardChanges) return this.reload();
    }

    public async commitOrdering() {
        await this.disableOrdering(false);
        this.commit();
    }

    public async redistribute(node: ProjectNode) {
        if (node?.children?.size) {
            let idx = 1;
            for (let child of node.children.values()) {
                if (child.item) child.item.order = idx++;
            }
            this._onDidChangeTreeData.fire();
        }
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
                this._refreshTree();
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
        if (!source[0]?.isDraggable) return;
        if (!this._isBatchOrderingEnabled) return;
        treeDataTransfer.set('application/vnd.code.tree.projectexplorerview', new vscode.DataTransferItem(source));
    }


    public async reload(): Promise<void> {
        let f = await this._fileManager.loadFiles();
        return this._refreshTree(f);
    }

    public _refreshTree(files?: FwFileInfo[]) {
        console.log("refrehsing tree...");
        files ??= this._stateManager.trackedFiles.map(f => f?.fileInfo).filter(a => a !== undefined);
        this._tree.clear();
        this._tree.root = this.buildHierarchy(files);
        this._onDidChangeTreeData.fire();
    }

    public commit(): void {
        const files = this._tree.toList();
        const renameMap: { oldPath: string, newPath: string }[] = [];

        files.forEach(f => {
            if (!f.isDraggable) return;
            if (!f.item.fsName) return;
            const oldPath = f.id;
            const newPath = f.buildFsPath(1);
            if (oldPath !== newPath) {
                renameMap.push({oldPath, newPath});
            }
        });

        if (renameMap.length > 1) {
            vscode.window.showInformationMessage(`Renaming ${renameMap.length} files...`,
                {modal: true}, 'OK').then(async (result) => {
                if (result === 'OK') {
                    await this._fileManager.batchRenameFiles(renameMap);
                }
                await this.reload();
            });
        } else if (renameMap.length === 1) {
            this._fileManager.batchRenameFiles(renameMap).then(() => this.reload());
        } else {
            this.reload();
        }

    }

    private _handleActiveTextEditorChanged(e: vscode.TextEditor | undefined) {
        if (!this._syncWithActiveEditorEnabled || !e) return;
        this.reveal(e.document.uri.fsPath);
    }

    public async reveal(fsPath: string, force = false) {
        const element = this._tree.getNode(fsPath);

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

            if (element.isVisible) {
               return this._treeView.reveal(element, revealOptions);
            } else {
                await this.filter(AllFilesFilter);
                revealOptions.focus = true;
                await this._treeView.reveal(element, revealOptions);

            }

        }
    }

    public startSelection(e: ProjectNode) {
        const node = this._tree.getNode(e.id);
        if (node) {
            vscode.commands.executeCommand('setContext',
                    FictionWriter.views.projectExplorer.is, action.compiling)
                .then(() => {
                    this._tree.toList().forEach(f => {
                        if (f.item.checked === undefined) {
                            f.item.checked = false;
                        }
                    });
                    this._treeView.description = "Compile";

                    this._updateCheckboxBasedOnMeta(node);
                    this._onDidChangeTreeData.fire();
                });
        }
    }

    public retrieveSelection(): string[] {
        this.discardSelection();
        return this._tree.toList()
            .filter(l => l.item.checked && l.hasTextContent)
            .map(l => l.id);
    }

    public discardSelection() {
        vscode.commands.executeCommand('setContext',
                FictionWriter.views.projectExplorer.is, action.none)
            .then(() => {
                this._tree.toList().forEach(f => {
                    f.item.checked = undefined;
                });
                this._treeView.description = undefined;

                this._onDidChangeTreeData.fire();
            });
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

        return this.reload();
    }

    private _updateCheckboxBasedOnMeta(root: ProjectNode) {
        root.item.checked = this._stateManager.get(root.id)?.metadata?.value?.compile !== 'exclude';
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