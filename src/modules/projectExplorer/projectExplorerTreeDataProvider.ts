import * as vscode from 'vscode';
import {OrderHandler} from "./orderHandler";
import {FwFileManager, asPosix} from "./fwFileManager";
import * as path from 'path';
import {FwFile, FwFileInfo} from "../../core/fileNameManager";
import {CancellationTokenSource, ThemeIcon} from "vscode";
import {ProseMirrorEditorProvider} from "../proseMirrorEditorView";
import {DisposeManager} from "../../core/disposable";


interface Node {
    parent?: Node;
    id: string;
    name: string;
    description?: string;
    order: number;
    prevOrder: number;
    isFile: boolean;
    isWorkspaceFolder: boolean;
    children?: Map<string, Node>;
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
        isFile: false,
        id: "root",
        order: 0,
        isWorkspaceFolder: false,
        prevOrder: 0
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

        fileManager
            .loadFiles()
            .then(files => {
                this.root = this.buildHierarchy(files);
                this._sortChildren(this.root);
                this._onDidChangeTreeData.fire();

            });

        this.manageDisposable(this._treeView, this._onDidChangeTreeData);
    }

    private buildHierarchy(paths: FwFileInfo[]): Node {
     const workspaceFolders = vscode.workspace.workspaceFolders
         ?.map(f => path.posix.normalize(asPosix(f.uri.fsPath))) ?? [];

     paths.forEach((p) => {
            const relativePath = vscode.workspace.asRelativePath(p.id, true);
            let basePath = p.id.replace(relativePath, "");
            const segments = relativePath.split(path.posix.sep).filter(Boolean); // Split path into segments and remove any empty segments
            let current = this.root;

            segments.forEach((segment, index) => {
                const tmpId = path.posix.join(current.id, segment);
                const isFile = index === segments.length - 1; // Mark as file if it's the last segment
                if (!isFile) basePath = path.posix.join(basePath, segment);

                if (!current.children?.has(tmpId)) {
                    current.children?.set(tmpId, {
                        parent: current,
                        name: isFile ? p.name : segment,
                        description: isFile ? p.ext : "folder",
                        id: tmpId,
                        order: p.order,
                        prevOrder: 0,
                        children: new Map(),
                        isFile: isFile,
                        isWorkspaceFolder: !isFile && workspaceFolders.includes(basePath)
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

        if (!element.isFile) {
            icon = "fa-folder";
        }
        if (this._isWorkspaceFolder(element)) {
            icon = "fa-inbox";
            label = `[${label}]`;
            description = ""
        }
        if (this._isRoot(element)) {
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
            collapsibleState: element?.isFile
                ? vscode.TreeItemCollapsibleState.None
                : vscode.TreeItemCollapsibleState.Collapsed,
            resourceUri: vscode.Uri.parse(element.id),
        };
    }

    private _canMove(node: Node) {
        return !this._isRoot(node) && !this._isWorkspaceFolder(node);
    }

    private _tryMoveToChildren(source: Node, dest?: Node): boolean {
        if (!this._canMove(source)) return false; // cannot move the root
        if (dest?.isFile) return false;     // cannot move a file to a file
        if (!dest?.parent) return false;  // cannot move a file to
        // root (it contains workspaceFolders)

        if (source.parent !== dest) {     // move to a different parent
            source.parent?.children?.delete(source.id);
            source.parent = dest;
            dest.children?.set(source.id, source);
        }

        return true;
    }

    private _isWorkspaceFolder(node: Node) {
        return node.isWorkspaceFolder;
    }

    private _isRoot(node?: Node) {
        return node === this.root;
    }

    // Drag and drop controller
    public async handleDrop(target: Node | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = sources.get('application/vnd.code.tree.projectExplorerView');

        if (!transferItem) return; // nothing to drop

        const source = this._getNode(transferItem.value[0]?.id ?? "");
        const dest = this._getNode(target?.id ?? "");

        if (!source || !dest) return; // don't know what to move where

        const sameType = (s: Node, d: Node) => s.isFile === d.isFile;
        const sameRoot = (s: Node, d: Node) => s.parent === d.parent;
        const folderOverFolder = (s: Node, d: Node) => !s.isFile && !d.isFile;
        const fileOverFile = (s: Node, d: Node) => s.isFile && d.isFile;
        const fileOverFolder = (s: Node, d: Node) => s.isFile && !d.isFile;
        const folderOverFile = (s: Node, d: Node) => !s.isFile && d.isFile;

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
        return this._getSiblings(node).filter(s => s.isFile === node.isFile);
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
                ...result.filter((a: Node) => !a.isFile),
                ...result.filter((a: Node) => a.isFile),
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
        const order = (a: Node) => a.order.toString().padStart(FwFile.maxPad, '0') + a.name;
        const all = [...root.children.values()]
            .sort((a, b) => order(a) > order(b)
                ? 1
                : order(a) < order(b)
                    ? -1
                    : 0);
        let counter = 0;

        all.forEach((c, order) => {
            counter += FwFile.fixedGap;
            if (c.order !== 0) counter = Math.max(c.order, counter);
            c.prevOrder = c.order;
            c.order = counter;
            this._sortChildren(c);
        });


    }
}

