import * as vscode from 'vscode';
import {ThemeColor, ThemeIcon} from 'vscode';
import {OrderHandler} from "./orderHandler";
import {asPosix, FwFileManager} from "../../core/fwFileManager";
import * as path from 'path';
import {FwFile} from "../../core/fwFile";
import {DisposeManager} from "../../core/disposable";
import {NodeType} from './nodeType';
import {NodeTree} from '../../core/tree/nodeTree';
import {FwFileInfo, FwType} from '../../core/fwFileInfo';
import {FaIcons, FictionWriter} from '../../core';
import {StateManager} from '../../core/stateManager';
import {FwFilter} from '../filters/models/fwFilter';
import {
    FileNode,
    FolderNode, ProjectNode,
    RootNode,
    WorkspaceFolderNode
} from './projectNodes';
import {ProjectItem} from './projectItem';
import {ProjectCache} from '../metadata';
import {ProjectsOptions} from './projectsOptions';

export class ProjectExplorerTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<ProjectNode>, vscode.TreeDragAndDropController<ProjectNode> {
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

    constructor(
        private _options: ProjectsOptions,
        private _fileManager: FwFileManager, private _stateManager: StateManager, private _projectCache: ProjectCache) {
        super();
        this._tree = new NodeTree<ProjectNode>(new RootNode());
        this._treeView = vscode.window.createTreeView(FictionWriter.views.projectExplorer.id, {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            dragAndDropController: this
        });
        this.reload();

        this.manageDisposable(
            this._treeView,
            this._onDidChangeTreeData,
            this._options.fileDescriptionMetadataKey.onChanged(_ => this.reload()),
            this._projectCache.onCacheChanged(() => {
                this.reload(); // TODO: Improve this, to not overlap with onFilesChanged
            }),
            // this._fileManager.onFilesChanged((files) => {
            //     this._refreshTree(files);
            // }),
            this._treeView.onDidCollapseElement((e) => {
                this._stateManager.set("tree_expanded_" + e.element.id, false);
            }),
            this._treeView.onDidExpandElement((e) => {
                this._stateManager.set("tree_expanded_" + e.element.id, true);
            }),
            vscode.window.onDidChangeActiveTextEditor(e => {
                this._handleActiveTextEditorChanged(e);
            })
        );
    }


    private buildHierarchy(fileInfos: FwFileInfo[]): ProjectNode {
        // sort results in order by id
        fileInfos.sort((a, b) => a.fsPath > b.fsPath ? 1 : a.fsPath === b.fsPath ? 0 : -1);

        const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => asPosix(f.uri.fsPath)) ?? [];
        fileInfos.forEach((fileInfo) => {
            if (workspaceFolders.includes(fileInfo.fsPath)) return;

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
                    let node: ProjectNode = new FileNode(tmpId);


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
                            node = new FileNode(tmpId);
                            // Ignore filter folder names, they will be built in the Filter View
                            if (FwFilter.isFilterFolderName(fileInfo.name)) {
                                return;

                            } else {
                                node = new FolderNode(tmpId);
                                node.item.name = fileInfo.name;
                                node.item.ext = fileInfo.ext;
                            }
                        } else {
                            node = new FileNode(tmpId);
                            node.item.ext = fileInfo.ext;
                            node.item.name = fileInfo.name;
                        }

                        if (this._options.fileDescriptionMetadataKey.value) {
                            const meta = this._projectCache.get(fileInfo.fsPath);
                            if (meta?.metadata) {
                                node.item.description = meta?.metadata[this._options.fileDescriptionMetadataKey.value]?.toString();
                            }
                        }
                    }
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
                        node = new FileNode(name);
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
        return this._tree.getChildren(element ? element.id : undefined);
    }

    public getTreeItem(element: ProjectNode): vscode.TreeItem {
        const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${element.id}`, true);
        const expanded = this._stateManager.get("tree_expanded_" + element.id, false);

        const item = {
            label: <any>{
                label: element.item.name,
                highlights: []
            },
            description: element.item.description,
            tooltip,
            iconPath: new ThemeIcon(FaIcons.fileLines, new ThemeColor('foreground')),
            collapsibleState: element?.type === NodeType.File
                ? vscode.TreeItemCollapsibleState.None
                : expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed,
            resourceUri: vscode.Uri.parse(element.id),
            contextValue: element.type,
            command: element.type == NodeType.File || element.type == NodeType.VirtualFolder ? {
                title: 'Open',
                command: 'vscode.open',
                arguments: [vscode.Uri.parse(element.id)]
            } : undefined
        };

        switch (element.type) {
            case NodeType.File:
                item.iconPath = new ThemeIcon(FaIcons.fileLines);
                item.description = (element.item.description ?? "");
                break;
            case NodeType.VirtualFolder:
                item.iconPath = new ThemeIcon(
                    element.item.fsName
                        ? FaIcons.fileLinesSolid
                        : FaIcons.fileExcel,
                    new ThemeColor(element.item.fsName
                        ? 'foreground'
                        : 'disabledForeground'));
                item.description = (element.item.description ?? "");

                break;
            case NodeType.Folder:
                item.iconPath = new ThemeIcon(element.item.name === '.trash'
                    ? FaIcons.trashCan : FaIcons.folder);
                item.description = (element.item.description ?? "");

                break;
            case NodeType.WorkspaceFolder:
                item.iconPath = new ThemeIcon(FaIcons.inbox);
                item.label.label = `[${element.item.name}]`;
                item.description = "";

                break;
            case NodeType.Filter:
                item.iconPath = new ThemeIcon(FaIcons.link);
                item.label.label = '...';//`${element.name}`;
                item.description = element.item.description;
                break;
            case NodeType.FilterRoot:
                item.iconPath = new ThemeIcon(FaIcons.magnifyingGlass);
                item.label.label = '...';//`${element.name}`;
                item.description = element.item.description;
                break;
            case NodeType.Root:
                item.iconPath = new ThemeIcon("root-folder");
                item.label.label = "/";
                item.description = "";
                break;
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
        if (!this._isBatchOrderingEnabled) {
            this.commit();
        }
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
        vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.isOrdering, true)
            .then(() => {
                this._isBatchOrderingEnabled = true;
                this._treeView.description = "Reordering";
            });
    }

    public async disableOrdering(discardChanges: boolean = true) {
        await vscode.commands.executeCommand('setContext', FictionWriter.views.projectExplorer.isOrdering, false);

        this._isBatchOrderingEnabled = false;
        this._treeView.description = "";
        if (discardChanges) return this.reload();
    }

    public async commitOrdering() {
        await this.disableOrdering(false);
        this.commit();
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

        treeDataTransfer.set('application/vnd.code.tree.projectexplorerview', new vscode.DataTransferItem(source));
    }


    public async reload(): Promise<void> {
        let f = await this._fileManager.loadFiles();
        return this._refreshTree(f);
    }

    public _refreshTree(files: FwFileInfo[]) {
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
            const newPath = f.buildFsPath();
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
        }

    }

    private _handleActiveTextEditorChanged(e: vscode.TextEditor | undefined) {
        if (!this._syncWithActiveEditorEnabled || !e) return;

        const element = this._tree.getNode(e.document.uri.fsPath);
        if (element) {
            this._treeView.reveal(element);
        }
    }
}

