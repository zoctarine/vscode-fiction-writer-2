import * as vscode from 'vscode';
import {OrderHandler} from "./orderHandler";
import {FwFileManager, asPosix} from "./fwFileManager";
import * as path from 'path';
import {FwFile, FwFileInfo} from "../../core/fileNameManager";
import {extensions, ThemeIcon, workspace} from "vscode";
import {DisposeManager} from "../../core/disposable";
import * as fs from 'node:fs';

enum NodeType {
    Root = "root",
    File = "file",
    Folder = "folder",
    VirtualFolder = "virtualFolder",
    WorkspaceFolder = "workspaceFolder",
}
interface Node {
    parent?: Node;
    id: string;
    name: string;
    description?: string;
    order: number;
    prevOrder: number;
    type: NodeType;
    children?: Map<string, Node>;
    fsName: string;
}

export class ProjectExplorerTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<Node>, vscode.TreeDragAndDropController<Node> {
    dropMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    dragMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    private _treeView: vscode.TreeView<Node>;
    private fileManager: FwFileManager;
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | null | void> = new vscode.EventEmitter<Node | undefined | null | void>();
    // We want to use an array as the event type, but the API for this is currently being finalized. Until it's finalized, use any.
    public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    public root: Node = {
        parent: undefined,
        name: 'root',
        children: new Map<string, Node>(),
        type: NodeType.Root,
        id: "root",
        order: 0,
        prevOrder: 0,
        fsName: ""
    };
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


    private buildHierarchy(paths: FwFileInfo[]): Node {
     const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => asPosix(f.uri.fsPath)) ?? [];
     paths.forEach((p) => {
         if (workspaceFolders.includes(p.id) ) return;

         const relativePath = vscode.workspace.asRelativePath(p.id, true);

         let basePath = p.id.replace(relativePath, "");
         console.log("PATH", [relativePath, basePath]);

            const segments = relativePath.split(path.posix.sep).filter(Boolean); // Split path into segments and remove any empty segments
            let current = this.root;
            current.fsName = basePath;
            current.id = basePath;

            segments.forEach((segment, index) => {
                const tmpId = path.posix.join(current.id, segment);
                console.log(tmpId);
                const isFile = index === segments.length - 1 && !p.isDir; // Mark as file if it's the last segment
                if (!isFile) basePath = path.posix.join(basePath, segment);
                let type = NodeType.File;
                if (!isFile && workspaceFolders.includes(basePath)){
                    type = NodeType.WorkspaceFolder;
                } else if (!isFile) { type = NodeType.Folder;}

                if (!current.children?.has(tmpId)) {
                    current.children?.set(tmpId, {
                        parent: current,
                        name: index === segments.length - 1 ? p.name : segment,
                        description: isFile ? p.ext : "folder",
                        id: tmpId,
                        order: p.order,
                        prevOrder: 0,
                        children: new Map(),
                        type: type,
                        fsName: segment
                    });
                }
                current = current.children?.get(tmpId)!;
            });
        });
        return this.root;
    }

    // Tree data provider
    public getChildren(element: Node): Node[] {
        return this._getChildren(element ? element.id : undefined);
    }

    public getTreeItem(element: Node): vscode.TreeItem {
        const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${element.id}`, true);
        const orderNr = OrderHandler.toBase36(element?.order ?? 0).padStart(6, "0");

        let icon: string|undefined = "fa-file-lines";
        let label = element.name;
        let description = element.description + "  :" + element.order.toString();

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
                highlights: []//element?.order !== element?.prevOrder ? [[0, 10]] : void 0
            },
            description: description,
            tooltip,
            iconPath: icon ? new ThemeIcon(icon) : "",
            collapsibleState: element?.type === NodeType.File
                ? vscode.TreeItemCollapsibleState.None
                : vscode.TreeItemCollapsibleState.Expanded,
            resourceUri: vscode.Uri.parse(element.id),
        };
    }

    private _canMove(node: Node) {
        return [NodeType.Folder, NodeType.File].includes(node.type);
    }

    private _tryMoveToChildren(source: Node, dest?: Node): boolean {
        if (!this._canMove(source)) return false; // cannot move the root)
        if (dest?.type === NodeType.File) return false;     // cannot move a file to a file
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
        const sameRoot = (s: Node, d: Node) => s.parent === d.parent;
        const folderOverFolder = (s: Node, d: Node) => s.type === NodeType.Folder && d.type === NodeType.Folder;
        const fileOverFile = (s: Node, d: Node) => s.type === NodeType.File && d.type === NodeType.File;
        const fileOverFolder = (s: Node, d: Node) => s.type === NodeType.File && d.type === NodeType.Folder;
        const folderOverFile = (s: Node, d: Node) => s.type === NodeType.Folder && d.type === NodeType.File;

        if (sameRoot(source, dest)) {
            // no need to move, but exit early if items cannot be reordered
            if (!this._canMove(source)) return;
        } else if (folderOverFolder(source, dest) || fileOverFolder(source, dest)) {
            if (!this._tryMoveToChildren(source, dest)) return;
        } else if (fileOverFile(source, dest) || folderOverFile(source, dest)) {
            if (!this._tryMoveToChildren(source, dest.parent)) return;
        }

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
        if (!this._canMove(source[0])) return;

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
            result = [...this.root.children?.values()??[]];
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
            this._sortChildren(this.root);
            this._onDidChangeTreeData.fire();
        });
    }
private createFsName(node: Node): string {
    return `${node.order.toString().padStart(8, '0')}__${node.name}`;
}
    public commit(): void {
        if (this._treeView.selection.length > 0){
            const item = this._treeView.selection[0];
            const segments = [this.createFsName(item)];
            let cursor = item?.parent;
            while (cursor && cursor?.type !== NodeType.WorkspaceFolder) {
                if (cursor) segments.push(this.createFsName(cursor));
                cursor = cursor.parent;
            }
            if (cursor)
            segments.push(cursor.id ?? "");
            const newPath = path.posix.join(...segments.reverse());
            console.log(newPath);
        }
        return;
        const files = this._flatten(this.root);
        const renameMap: { oldPath: string, newPath: string }[] = [];
        this.fileManager.loadFiles().then(df => {
            files.forEach(f => {
                const diskFile = df.find(d => d.id === f.id);
                const oldPath = f.id;
                const newPath =
                    f.type === NodeType.File
                        ? path.posix.join(f.fsName, `${f.order.toString().padStart(7, '0')}__${f.name}${diskFile?.ext ?? ""}`)
                        :  path.posix.join(f.parent?.fsName ?? "", `${f.order.toString().padStart(7, '0')}__${f.name}${diskFile?.ext ?? ""}`);
                if (this._canMove(f) && oldPath !== newPath){
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
        const renamePromises = renameMap.map(({ oldPath, newPath }) => this._renameFile(oldPath, newPath));
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

