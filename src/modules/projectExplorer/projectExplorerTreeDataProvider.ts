import * as vscode from 'vscode';
import {ThemeColor, ThemeIcon} from 'vscode';
import {OrderHandler} from "./orderHandler";
import {asPosix, FwFileManager} from "../../core/fwFileManager";
import * as path from 'path';
import {FwFile} from "../../core/fwFile";
import {DisposeManager} from "../../core/disposable";
import {NodeType} from './nodeType';
import {Node, FileNode, FolderNode, VirtualFolderNode, WorkspaceFolderNode} from './node';
import {NodeTree} from './nodeTree';
import {FwFileInfo} from '../../core/fwFileInfo';
import {FaIcons} from '../../core';
import {StateManager} from '../../core/stateManager';

export class ProjectExplorerTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<Node>, vscode.TreeDragAndDropController<Node> {
    dropMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    dragMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    private _treeView: vscode.TreeView<Node>;
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | null | void> = new vscode.EventEmitter<Node | undefined | null | void>();
    // We want to use an array as the event type, but the API for this is currently being finalized. Until it's finalized, use any.
    public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    public _tree: NodeTree;
    private _mixFoldersAndFiles = true;


    constructor(private _fileManager: FwFileManager, private _stateManager: StateManager) {
        super();
        this._tree = new NodeTree();
        this._treeView = vscode.window.createTreeView('fictionWriter.views.projectExplorer', {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            dragAndDropController: this
        });

        this.reload();

        this.manageDisposable(
            this._treeView,
            this._onDidChangeTreeData,
            this._fileManager.onFilesChanged((files) => {
                this._refreshTree(files);
            }),
            this._treeView.onDidCollapseElement((e) => {
                this._stateManager.set("tree_expanded_" + e.element.id, false);
            }),
            this._treeView.onDidExpandElement((e) => {
                this._stateManager.set("tree_expanded_" + e.element.id, true);
            })
        );
    }


    private buildHierarchy(fileInfos: FwFileInfo[]): Node {
        // sort results in order by id
        fileInfos.sort((a, b) => a.id > b.id ? 1 : a.id === b.id ? 0 : -1);

        const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => asPosix(f.uri.fsPath)) ?? [];
        fileInfos.forEach((fileInfo) => {
            if (workspaceFolders.includes(fileInfo.id)) return;

            const relativePath = vscode.workspace.asRelativePath(fileInfo.id, true);

            let basePath = fileInfo.id.replace(relativePath, "");

            const segments = relativePath.split(path.posix.sep).filter(Boolean); // Split path into segments and remove any empty segments
            let current = this._tree.root;
            current.fsName = basePath;
            current.id = basePath;

            segments.forEach((segment, index) => {
                const tmpId = path.posix.join(current.id, segment);


                if (!current.children?.has(tmpId)) {
                    const isFile = index === segments.length - 1 && !fileInfo.isDir; // Mark as file if it's the last segment
                    if (!isFile) basePath = path.posix.join(basePath, segment);
                    let node = new FileNode(tmpId);
                    if (!isFile && workspaceFolders.includes(basePath)) {
                        node = new WorkspaceFolderNode(tmpId);
                    } else if (!isFile) {
                        node = new FolderNode(tmpId);
                    }

                    node.parent = current;
                    node.name = index === segments.length - 1 ? fileInfo.name : segment;
                    node.description = isFile ? fileInfo.ext : "folder";
                    node.order = fileInfo.order;
                    node.fsName = segment;
                    node.ext = index === segments.length - 1 ? fileInfo.ext : "";

                    current.children?.set(node.id, node);
                }
                current = current.children?.get(tmpId)!;
            });

            if (fileInfo.parentOrder.length > 0 && current.type === NodeType.File) {
                let cursor = current.parent;

                fileInfo.parentOrder.forEach((order, index) => {
                    if (!cursor) return;

                    let node = [...cursor.children?.values() ?? []].find(a => a.order === order);
                    if (!node) {
                        const parentOrders = fileInfo.parentOrder.slice(0, index + 1).map(a => FwFile.toOrderString(a));
                        const name = path.posix.join(fileInfo.location, parentOrders.join('') + ` new${fileInfo.ext}`);
                        node = new FileNode(name);
                        node.parent = cursor;
                        node.name = " ";
                        node.description = "[missing file]";
                        node.order = order;
                        node.fsName = "";
                        cursor?.children?.set(node.id, node);
                    }

                    cursor = node;
                    if (cursor) {
                        cursor.convertTo(VirtualFolderNode);
                    }
                });

                current?.parent?.children?.delete(current.id);
                current.parent = cursor;
                cursor?.children?.set(current.id, current);
            }
        });
        return this._tree.root;
    }

    public getParent(element: Node): Node | undefined {
        return element.parent;
    }

    // Tree data provider
    public getChildren(element: Node): Node[] {
        return this._tree.getChildren(element ? element.id : undefined);
    }

    public getTreeItem(element: Node): vscode.TreeItem {
        const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${element.id}`, true);
        const expanded = this._stateManager.get("tree_expanded_" + element.id, false);

        const item = {
            label: <any>{
                label: element.name,
                highlights: []
            },
            description: element.description,
            tooltip,
            iconPath: new ThemeIcon(FaIcons.fileLines, new ThemeColor('foreground')),
            collapsibleState: element?.type === NodeType.File
                ? vscode.TreeItemCollapsibleState.None
                : expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed,
            resourceUri: vscode.Uri.parse(element.id),
            contextValue: element.type,
            command: {
                title: 'Open',
                command: 'vscode.open',
                arguments: [vscode.Uri.parse(element.id)]
            }
        };

        switch (element.type) {
            case NodeType.File:
                item.iconPath = new ThemeIcon(FaIcons.fileLines);
                item.description = element.description;
                break;
            case NodeType.VirtualFolder:
                item.iconPath = new ThemeIcon(
                    element.fsName
                        ? FaIcons.fileLinesSolid
                        : FaIcons.fileExcel,
                    new ThemeColor(element.fsName
                        ? 'foreground'
                        : 'disabledForeground'));
                break;
            case NodeType.Folder:
                item.iconPath = new ThemeIcon(element.name === '.trash'
                    ? FaIcons.trashCan : FaIcons.folder);
                break;
            case NodeType.WorkspaceFolder:
                item.iconPath = new ThemeIcon(FaIcons.inbox);
                item.label.label = `[${element.name}]`;
                item.description = "";
                break;
            case NodeType.Root:
                item.iconPath = new ThemeIcon("root-folder");
                item.label.label = "/";
                item.description = "";
                break;
        }

        return item;
    }

    public makeVirtualFolder(node: Node): void {
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

    public addFile(node: Node): void {
        this._addNewChild(node ?? this._treeView.selection[0], NodeType.File);
    }

    public addFolder(node: Node): void {
        this._addNewChild(node ?? this._treeView.selection[0], NodeType.Folder);
    }

    public rename(node: Node): void {
        node = node ?? this._treeView.selection[0];
        if (node) {
            vscode.window.showInputBox({prompt: 'Enter new name', value: node.name}).then((value) => {
                if (value) {
                    node.name = value;
                    this._fileManager.renameFile(node.id, node.buildFsPath()).then(() => {
                    });
                }
            });
        }
    }

    public delete(node: Node): void {
        node = node ?? this._treeView.selection[0];

        if (node) {
            this._fileManager.deleteFile(node.id);
        }
    }

    private _addNewChild(node: Node | undefined, type: NodeType = NodeType.File): void {
        if (!node) return;
        const newNode = new Node('new' + Math.random());
        newNode.type = type;
        newNode.name = "new";
        newNode.ext = ".md";

        this._insert(newNode, node);
        newNode.id = newNode.buildFsPath();
        newNode.fsName = newNode.buildFsName();
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

    private _tryMoveToChildren(source: Node, dest?: Node): boolean {
        if (!source?.isDraggable) return false; // cannot move the root)
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
    public async handleDrop(target: Node | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = sources.get('application/vnd.code.tree.projectExplorerView');
        if (!transferItem) return; // nothing to drop
        const source = this._tree.getNode(transferItem.value[0]?.id ?? "");
        const dest = this._tree.getNode(target?.id ?? "");
        this._insert(source, dest);
        this.commit();
    }

    private _insert(source?: Node, dest?: Node) {
        if (!source || !dest) return; // don't know what to move where
        if (!source.isDraggable) return; // cannot move
        if (source === dest) return; // no need to move

        // find first acceptable position
        if (dest.acceptsChild(source)) {
            if (!this._tryMoveToChildren(source, dest)) return;
        } else {
            if (!this._tryMoveToChildren(source, dest.parent)) return;
        }

        // Reorder source siblings (wherever it ended up)
        const items = this._mixFoldersAndFiles
            ? this._tree.getSiblings(source)
            : this._tree.getMatchingSiblings(source);
        const siblings = items
            .map(a => ({id: a.id, order: a.order}))
            .sort((a, b) => a.order - b.order);

        new OrderHandler(siblings)
            .reorder(source.id, dest?.id ?? "")
            .get()
            .forEach(e => {
                const item = this._tree.getNode(e.id);
                if (item) {
                    item.order = e.order;
                }
            });

        this._onDidChangeTreeData.fire();
    }

    public async handleDrag(source: Node[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        if (!source[0]?.isDraggable) return;

        treeDataTransfer.set('application/vnd.code.tree.projectExplorerView', new vscode.DataTransferItem(source));
    }


    public reload(): void {
        this._fileManager.loadFiles().then(f => this._refreshTree(f));
    }

    public _refreshTree(files: FwFileInfo[]) {
        this._tree.clear();
        this._tree.root = this.buildHierarchy(files);
        //this._sortChildren(this.root);
        this._onDidChangeTreeData.fire();
    }

    public commit(): void {
        const files = this._tree.toList();
        this._fileManager.loadFiles().then(df => {
            const renameMap: { oldPath: string, newPath: string }[] = [];

            files.forEach(f => {
                if (!f.isDraggable) return;
                if (!f.fsName) return;
                const oldPath = f.id;
                const newPath = f.buildFsPath();
                if (oldPath !== newPath) {
                    renameMap.push({oldPath, newPath});
                }
            });

            if (renameMap.length > 1) {
                vscode.window.showInformationMessage(`Renaming ${renameMap.length} files...`,
                    {modal: true}, 'OK').then(() => {
                    this._fileManager.batchRenameFiles(renameMap).then(() => {
                        this.reload();
                    });
                });
            } else if (renameMap.length === 1) {
                this._fileManager.batchRenameFiles(renameMap).then(() => {
                    this.reload();
                });
            }
        });

    }

}

