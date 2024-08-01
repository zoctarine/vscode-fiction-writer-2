import * as vscode from 'vscode';
import {OrderHandler} from "./orderHandler";
import {FwFileManager, asPosix} from "./fwFileManager";
import * as path from 'path';
import {FwFile, FwFileInfo} from "../../core/fileNameManager";
import {extensions, ThemeIcon, workspace} from "vscode";
import {DisposeManager} from "../../core/disposable";
import * as fs from 'node:fs';

let isCtrlPressed = true;


export enum NodeType {
    Root = "root",
    File = "file",
    Folder = "folder",
    VirtualFolder = "virtualFolder",
    WorkspaceFolder = "workspaceFolder",
}

export class Node {
    id: string;
    name: string;
    ext: string = "";
    parent?: Node = undefined;
    description?: string;
    order: number = 0;
    prevOrder: number = 0;
    type: NodeType = NodeType.Root;
    children?: Map<string, Node> = new Map<string, Node>();
    fsName: string = '';

    constructor(id: string, name?:string) {
        this.id = id;
        this.name = name ?? this.id;
    }

    acceptsChild(child: Node): boolean {
        if (!child.isDraggable) return false;
        if (child === this) return false;
        if (child.parent === this) return false;
        if (this.id.startsWith(child.id)) return false;
        if (this.type === NodeType.File) return false;
        if (this.type === NodeType.VirtualFolder && ![NodeType.VirtualFolder, NodeType.File].includes(child.type)) return false;
        if (this.type === NodeType.Folder && ![NodeType.Folder, NodeType.File, NodeType.VirtualFolder].includes(child.type)) return false;

        return true;
    }

    get acceptsChildren(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.VirtualFolder
            || this.type === NodeType.WorkspaceFolder;
    }

    get isDraggable(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.File
            || this.type === NodeType.VirtualFolder;
    }
}

export class ProjectExplorerTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<Node>, vscode.TreeDragAndDropController<Node> {
    dropMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    dragMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    private _treeView: vscode.TreeView<Node>;
    private fileManager: FwFileManager;
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | null | void> = new vscode.EventEmitter<Node | undefined | null | void>();
    // We want to use an array as the event type, but the API for this is currently being finalized. Until it's finalized, use any.
    public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    public root: Node = new Node("root");
    private _mixFoldersAndFiles = true;


    constructor(fileManager: FwFileManager) {
        super();
        this.fileManager = fileManager;
        this._treeView = vscode.window.createTreeView('projectExplorerView', {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            dragAndDropController: this
        });

        this.reload();

        this.manageDisposable(this._treeView, this._onDidChangeTreeData);
    }


    private buildHierarchy(fileInfos: FwFileInfo[]): Node {
        // sort results in order by id
        fileInfos.sort((a, b) => a.id > b.id ? 1: a.id === b.id ? 0 : -1);

        const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => asPosix(f.uri.fsPath)) ?? [];
        fileInfos.forEach((fileInfo) => {
            if (workspaceFolders.includes(fileInfo.id)) return;

            const relativePath = vscode.workspace.asRelativePath(fileInfo.id, true);

            let basePath = fileInfo.id.replace(relativePath, "");

            const segments = relativePath.split(path.posix.sep).filter(Boolean); // Split path into segments and remove any empty segments
            let current = this.root;
            current.fsName = basePath;
            current.id = basePath;

            segments.forEach((segment, index) => {
                const tmpId = path.posix.join(current.id, segment);
                const isFile = index === segments.length - 1 && !fileInfo.isDir; // Mark as file if it's the last segment
                if (!isFile) basePath = path.posix.join(basePath, segment);
                let type = NodeType.File;
                if (!isFile && workspaceFolders.includes(basePath)) {
                    type = NodeType.WorkspaceFolder;
                } else if (!isFile) {
                    type = NodeType.Folder;
                }

                if (!current.children?.has(tmpId)) {
                    const node = new Node(tmpId);
                    node.parent = current;
                    node.name = index === segments.length - 1 ? fileInfo.name : segment;
                    node.description = isFile ? fileInfo.ext : "folder";
                    node.order = fileInfo.order;
                    node.prevOrder = 0;
                    node.type = type;
                    node.fsName = segment;
                    node.ext = index === segments.length - 1 ? fileInfo.ext : "";

                    current.children?.set(node.id, node);

                }
                current = current.children?.get(tmpId)!;


            });

            if (fileInfo.parentOrder.length > 0 && current.type === NodeType.File){
                let cursor = current.parent;

                fileInfo.parentOrder.forEach((order, index) => {
                    if (!cursor) return;

                    const orderId = order.toString();
                    let node = [...cursor.children?.values()??[]].find(a=>a.order === order);
                    if (!node){
                        node = new Node(orderId);
                        node.parent = cursor;
                        node.name =  "?";
                        node.description = "";
                        node.order = order;
                        node.prevOrder = 0;
                        node.fsName = "";
                        cursor?.children?.set(node.id, node);
                    }

                    cursor = node;
                    if (cursor)
                        cursor.type = NodeType.VirtualFolder;
                });

               current?.parent?.children?.delete(current.id);
               current.parent = cursor;
               cursor?.children?.set(current.id, current);
            }
        });
        return this.root;
    }

    // Tree data provider
    public getChildren(element: Node): Node[] {
        return this._getChildren(element ? element.id : undefined);
    }

    public getTreeItem(element: Node): vscode.TreeItem {
        const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${element.id}`, true);

        let icon: string | undefined = "fa-file-lines";
        let label = element.name;
        let description = element.description + "  :" + element.order.toString();
        if (element.type === NodeType.VirtualFolder) {
            icon = element.fsName
                    ? "fa-file-lines-solid"
                    : "fa-file-excel";
        }
        if (element.type === NodeType.Folder) {
            icon = "fa-folder";
        }
        if (element.type === NodeType.WorkspaceFolder) {
            icon = "fa-inbox";
            label = `[${label}]`;
            description = "";
        }
        if (element.type === NodeType.Root) {
            icon = "root-folder";
            label = "/";
            description = "";
        }

        return {
            label: <any>{
                label: label,
                highlights: [],//element?.order !== element?.prevOrder ? [[0, 10]] : void 0,
            },
            description: description,
            tooltip,
            iconPath: icon ? new ThemeIcon(icon) : "",
            collapsibleState: element?.type === NodeType.File
                ? (element?.children?.size ?? 0 > 0 ?  vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
                : vscode.TreeItemCollapsibleState.Expanded,
            resourceUri: vscode.Uri.parse(element.id),
        };
    }

    public makeVirtualFolder(node: Node): void {
        if (node.type === NodeType.File) {
            node.type = NodeType.VirtualFolder;
            this._onDidChangeTreeData.fire();
        }  else if (node.type === NodeType.VirtualFolder){
            if (node.children?.size===0){
                node.type = NodeType.File;
                this._onDidChangeTreeData.fire();
            }
        }
    }
    private _tryMoveToChildren(source: Node, dest?: Node): boolean {
        if (!source?.isDraggable) return false; // cannot move the root)
        // if (dest?.type === NodeType.File) return false;     // cannot move a file to a file
        if (!dest?.parent) return false;  // cannot move a file to
        if (dest.id.startsWith(source.id)) return false; // cannot move into itself

        if (source.parent !== dest) {     // move to a different parent
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
        const source = this._getNode(transferItem.value[0]?.id ?? "");
        const dest = this._getNode(target?.id ?? "");
        if (!source || !dest) return; // don't know what to move where

        const sameType = (s: Node, d: Node) => s.type === d.type;
        const sameRoot = (s: Node, d: Node, isCtrlPressed: boolean) => s.parent === d.parent && isCtrlPressed;
        const folderOverFolder = (s: Node, d: Node) => s.type === NodeType.Folder && d.type === NodeType.Folder;
        const fileOverFile = (s: Node, d: Node) => s.type === NodeType.File && d.type === NodeType.File;
        const fileOverFolder = (s: Node, d: Node) => s.type === NodeType.File && d.type === NodeType.Folder;
        const folderOverFile = (s: Node, d: Node) => s.type === NodeType.Folder && d.type === NodeType.File;

        if (!source.isDraggable) return; // cannot move
        if (source === dest) return; // no need to move
        if (dest.acceptsChild(source)) {
            if (!this._tryMoveToChildren(source, dest)) return;
        } else {
            if (!this._tryMoveToChildren(source, dest.parent)) return;
        }
        // if (sameRoot(source, dest, false)) {
        //     // no need to move, but exit early if items cannot be reordered
        // } else if (folderOverFolder(source, dest) || fileOverFolder(source, dest) || (fileOverFile(source, dest) && isCtrlPressed)) {
        //     if (!this._tryMoveToChildren(source, dest)) return;
        // } else if ((fileOverFile(source, dest) && !isCtrlPressed) || folderOverFile(source, dest)) {
        //     console.warn("C2");
        //     if (!this._tryMoveToChildren(source, dest.parent)) return;
        // }
        //
        // console.warn("C3");

        // Reorder source siblings (wherever it ended up)
        const items = this._mixFoldersAndFiles
            ? this._getSiblings(source)
            : this._getMatchingSiblings(source);
        const siblings = items
            .map(a => ({id: a.id, order: a.order}))
            .sort((a, b) => a.order - b.order);

        new OrderHandler(siblings)
            .reorder(source.id, dest?.id ?? "")
            .get()
            .forEach(e => {
                const item = this._getNode(e.id);
                if (item) {
                    item.prevOrder = item.order;
                    item.order = e.order;
                }
            });

        this._onDidChangeTreeData.fire();
    }

    public async handleDrag(source: Node[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        if (!source[0]?.isDraggable) return;

        treeDataTransfer.set('application/vnd.code.tree.projectExplorerView', new vscode.DataTransferItem(source));
    }

    _getSiblings(node: Node): Node[] {
        if (!node) {
            return [];
        }
        if (!node.parent) {
            return [this.root];
        }
        return [...node.parent.children?.values() ?? []];
    }

    _getMatchingSiblings(node: Node): Node[] {
        return this._getSiblings(node).filter(s => s.type === s.type);
    }

    _getChildren(key: string | undefined): Node[] {
        let result: Node[] = [];
        if (!key) {
            result = [...this.root.children?.values() ?? []];
        } else {
            const node = this._getNode(key);
            if (node && node.children) {
                result = [...node.children.values()];
            }
        }

        result.sort((a: Node, b: Node) => a.order - b.order);

        return this._mixFoldersAndFiles
            ? [...result]
            : [
                ...result.filter((a: Node) => a.type === NodeType.WorkspaceFolder),
                ...result.filter((a: Node) => a.type === NodeType.Folder),
                ...result.filter((a: Node) => a.type === NodeType.File),
            ];
    }

    _getNode(element: string | undefined, tree?: Map<string, Node>): Node | undefined {
        if (!element) {
            return undefined;
        }

        const currentNode = tree ??
            new Map<string, Node>([[this.root.id, this.root]]);

        // Check if the current node has the element
        const node = currentNode.get(element);
        if (node) {
            return node;
        }

        // If not found, recursively search in the children of the current node
        for (const childNode of currentNode.values()) {
            if (childNode.children && childNode.children.size > 0) {
                const found = this._getNode(element, childNode.children);
                if (found) {
                    return found;
                }
            }
        }

        // If the node is not found in any children, return undefined
        return undefined;
    }

    private _sortChildren(root?: Node) {
        if (!root?.children) {
            return;
        }
        const all = [...root.children.values()]
            .sort((a, b) => a.order - b.order);
        let counter = 0;

        all.forEach((c, order) => {
            counter += FwFile.fixedGap;
            if (c.order !== 0) counter = Math.max(c.order, counter);
            c.prevOrder = c.order;
            c.order = counter;
            this._sortChildren(c);
        });


    }

    public reload(): void {
        this.fileManager.loadFiles().then(files => {
            this.root.children?.clear();
            this.root = this.buildHierarchy(files);
            //this._sortChildren(this.root);
            this._onDidChangeTreeData.fire();
        });
    }

    private createFsName(node: Node): string {
        return `[${node.order.toString(FwFile.radix).padStart(FwFile.pad, '0')}] ${node.name}${node.ext}`;
    }

    private createFsPath(node: Node): string {
        const segments = [this.createFsName(node)];
        let cursor = node?.parent;
        while (cursor && cursor?.type !== NodeType.WorkspaceFolder) {
            if (cursor.type === NodeType.VirtualFolder) {
                const prev=segments[segments.length - 1];
                segments[segments.length - 1] = `[${cursor.order.toString(FwFile.radix).padStart(FwFile.pad, '0')}]`+prev;
            } else {
                if (cursor) segments.push(this.createFsName(cursor));
            }
            cursor = cursor.parent;
        }
        if (cursor) {
            segments.push(cursor.id ?? "");
        }
        return path.posix.join(...segments.reverse());
    }

    public commit(): void {
        const files = this._flatten(this.root);
        const renameMap: { oldPath: string, newPath: string }[] = [];
        this.fileManager.loadFiles().then(df => {
            files.forEach(f => {
                if (!f.isDraggable) return;
                if (!f.fsName)return;
                const oldPath = f.id;
                const newPath = this.createFsPath(f);
                if (f.isDraggable && oldPath !== newPath) {
                    renameMap.push({oldPath, newPath});
                }
            });

            this._batchRenameFiles(renameMap).then(() => {
                this.reload();
            });
        });

    }

    public _renameFile(oldPath: string, newPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public _batchRenameFiles(renameMap: { oldPath: string, newPath: string }[]): Promise<void[]> {
        const renamePromises = renameMap.map(({oldPath, newPath}) => this._renameFile(oldPath, newPath));
        return Promise.all(renamePromises);
    }

    private _flatten(root: Node): Node[] {
        const result: Node[] = [];

        const traverse = (node: Node) => {
            if (!node) return;
            result.push(node);
            if (node.children) {
                node.children.forEach(child => traverse(child));
            }
        };

        traverse(root);
        return result;
    }
}

