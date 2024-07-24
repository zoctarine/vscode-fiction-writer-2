import * as vscode from 'vscode';
import {OrderHandler} from "./orderHandler";
import {fileManager} from "./fileManager";
import * as path from 'path';

fileManager.initialize()

interface Node {
    id: string;
    name: string;
    order: number;
    prevOrder: number;
    children?: Map<string, Node>;
}

export class ProjectExplorerTreeDataProvider implements vscode.TreeDataProvider<Node>, vscode.TreeDragAndDropController<Node> {
    dropMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    dragMimeTypes = ['text/uri-list'];
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | null | void> = new vscode.EventEmitter<Node | undefined | null | void>();
    // We want to use an array as the event type, but the API for this is currently being finalized. Until it's finalized, use any.
    public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    public root = new Map<string, Node>([
        ["1", {id: "1", name: "Chapter 1", order: OrderHandler.gap * 1, prevOrder: OrderHandler.gap * 1}],
        ["2", {id: "2", name: "Chapter 2", order: OrderHandler.gap * 2, prevOrder: OrderHandler.gap * 2}],
        ["3", {id: "3", name: "Chapter 2.1", order: OrderHandler.gap * 3, prevOrder: OrderHandler.gap * 3}],
        ["4", {id: "4", name: "Chapter 3", order: OrderHandler.gap * 4, prevOrder: OrderHandler.gap * 4}],
        ["5", {id: "5", name: "The End", order: OrderHandler.gap * 5, prevOrder: OrderHandler.gap * 5}],
        ["6", {id: "6", name: "Annex", order: OrderHandler.gap * 6, prevOrder: OrderHandler.gap * 6}],
        ["7", {id: "7", name: "Notes", order: OrderHandler.gap * 7, prevOrder: OrderHandler.gap * 7}],
    ]);

    constructor(context: vscode.ExtensionContext) {
        const view = vscode.window.createTreeView('projectExplorerView', {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            dragAndDropController: this
        });
        context.subscriptions.push(view);
        fileManager.loadFiles()
            .then(files => {
                this.root = new Map<string, Node>();
                let order = 0;
                files.forEach((f, idx) => {
                    const basename = path.posix.basename(f.path);
                    const ext = path.posix.extname(f.path);
                    for (let i = 1; i < 10; i++) {
                        this.root.set(f.path + i, {
                            id: f.path + i,
                            name: basename.replace(/\.(_fw\.md)+$/, "") + order,
                            order: OrderHandler.gap * (order + 1),
                            prevOrder: OrderHandler.gap * (order + 1),
                        });
                        order++;
                    }
                });

                this._onDidChangeTreeData.fire();

            })
    }

    // Tree data provider
    public getChildren(element: Node): Node[] {
        return this._getChildren(element ? element.id : undefined);
    }

    public getTreeItem(element: Node): vscode.TreeItem {
        const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${element.id}`, true);
        //const orderNr = element?.order.toString();//OrderHandler.toBase36(element?.order ?? 0);
        const orderNr = OrderHandler.toBase36(element?.order ?? 0).padStart(6, "0");
        const label = element?.order.toString().padStart(10, "0");
        return {
            label: <any>{
                label: label,
                highlights: element?.order !== element?.prevOrder ? [[0, 10]] : void 0
            },
            description:  orderNr + "__" + element?.name,
            tooltip,

            collapsibleState: vscode.TreeItemCollapsibleState.None,
            resourceUri: vscode.Uri.parse(`/tmp/${element.id}`),
        };
    }


    dispose(): void {
        // nothing to dispose
    }

    // Drag and drop controller

    public async handleDrop(target: Node | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = sources.get('application/vnd.code.tree.projectExplorerView');
        if (!transferItem) {
            return;
        }
        const treeItems: Node[] = transferItem.value;
        //  let roots = this._getLocalRoots(treeItems);
        const sourceKey = treeItems[0]?.id ?? "";
        const destKey = target?.id ?? "";

        const source = this.root.get(sourceKey);
        const dest = this.root.get(destKey);

        console.log(`From ${source?.order}:${source} to ${dest?.order}:${dest}`);

        if (source) {
            const all = [...this.root.values()];
            all.sort((a: Node, b: Node) => a.order - b.order);

            const orderHandler = new OrderHandler(
                all.map(a => ({id: a.id, order: a.order})),
            );
            orderHandler.move(source.id, dest?.id ?? "");

            orderHandler.get().forEach(e => {
                const item = this.root.get(e.id);
                if (item) {
                    item.prevOrder = item.order;
                    item.order = e.order;
                }
            });
            this._onDidChangeTreeData.fire();
        }
    }

    public async handleDrag(source: Node[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        treeDataTransfer.set('application/vnd.code.tree.projectExplorerView', new vscode.DataTransferItem(source));
    }

    _getChildren(key: string | undefined): Node[] {
        let result: Node[] = [];
        if (!key) {
            result = [...this.root.values()];
        } else {
            const treeElement = this._getTreeElement(key);
            if (treeElement && treeElement.children) {
                result = [...treeElement.children.values()];
            }
        }

        result.sort((a: Node, b: Node) => a.order - b.order);
        return result;
    }

    _getTreeElement(element: string | undefined, tree?: Map<string, Node>): Node | undefined {
        if (!element) {
            return {id: "root", name: "test", order: 0, children: this.root, prevOrder: 0};
        }
        console.log("The tree: ", tree);
        const currentNode = tree ?? this.root;
        console.log("Current node", currentNode);
        for (const prop in currentNode.keys()) {
            if (prop === element) {
                return currentNode.get(prop);
            } else {
                const treeElement = this._getTreeElement(element, currentNode.get(prop)?.children);
                if (treeElement) {
                    return treeElement;
                }
            }
        }
    }

}

