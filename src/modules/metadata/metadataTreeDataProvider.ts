import * as vscode from 'vscode';
import {
    FileDecoration,
    TabInputCustom,
    TabInputWebview,
    ThemeColor,
    ThemeIcon,
    TreeItem,
    TreeItemCollapsibleState,
    Uri
} from 'vscode';
import {IMetaState, StateManager} from '../../core/state';
import {MetadataOptions} from './metadataOptions';
import {ColorResolver, IconResolver} from './iconsAndColors';
import {selectMetadataColor, selectMetadataIcon, selectMetadataTarget} from './inputBoxes';
import {DisposeManager, log} from '../../core';
import {Metadata, MetaNodeType} from '../../core/metadata';
import {TreeStructure} from '../../core/tree/treeStructure';
import {ProseMirrorEditorProvider} from '../richTextEditor/proseMirrorEditorProvider';
import {ActiveDocumentMonitor} from '../../core/activeDocumentMonitor';
import {TreeNode} from '../../core/tree/treeNode';

export class MetaItem {
    name: string = "";
    key: string = "";
    value?: any;
    icon?: string;
    description?: string;
    type: MetaNodeType = MetaNodeType.None;
    update = (newValue: any) => {
    };
}

export class MetadataTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<TreeNode<MetaItem>> {
    public static readonly viewType = 'fictionWriter.views.metadata';
    private _tree: TreeStructure<MetaItem>;
    private _treeView: vscode.TreeView<TreeNode<MetaItem>>;
    private _document: vscode.TextDocument | undefined;
    private _metadata: IMetaState | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<TreeNode<MetaItem> | undefined | null | void> = new vscode.EventEmitter<TreeNode<MetaItem> | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeNode<MetaItem> | undefined | null | void> = this._onDidChangeTreeData.event;

    // EventEmitter and Event for selection changes
    private _onDidChangeSelection: vscode.EventEmitter<TreeNode<MetaItem> | undefined> = new vscode.EventEmitter<TreeNode<MetaItem> | undefined>();
    public readonly onDidChangeSelection: vscode.Event<TreeNode<MetaItem> | undefined> = this._onDidChangeSelection.event;

    constructor(private _options: MetadataOptions,
                private _stateManager: StateManager,
                private _resolvers: {
                    iconResolver: IconResolver;
                    colorResolver: ColorResolver,
                },
                private _activeDocumentMonitor: ActiveDocumentMonitor) {
        super();
        this._tree = new TreeStructure(new TreeNode<MetaItem>('root', new MetaItem()));
        this._treeView = vscode.window.createTreeView(MetadataTreeDataProvider.viewType, {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            // dragAndDropController: this
        });
        this._loadDocument(_activeDocumentMonitor.activeDocument);

        this.manageDisposable(
            this._treeView,

            _activeDocumentMonitor.onActiveDocumentChanged((e) => {
                this._loadDocument(e);
            }),

            this._stateManager.onFilesStateChanged(e => {
                if (e.files.map(f => f.state.fwItem?.ref.fsPath).includes(this._document?.uri.fsPath)) {
                    this._loadDocument(this._document);
                }
            }),
            this._treeView.onDidCollapseElement((e) => {
                if (e.element.children) {
                    e.element.data.description = `${e.element.children.map(c => c.data.name).join(', ')}`;
                }
                this._onDidChangeTreeData.fire(e.element);
            }),
            this._treeView.onDidExpandElement((e) => {
                if (e.element.children) {
                    e.element.data.description = '';
                }
                this._onDidChangeTreeData.fire(e.element);
            }),
            this._treeView.onDidChangeSelection((e => {
                if (!e.selection) return;
                this._onDidChangeSelection.fire(e.selection ? e.selection[0] : undefined);
            })),
            this._onDidChangeSelection
        );
    }

    private _loadDocument(document: vscode.TextDocument | undefined) {
        this._document = document;
        this._metadata = undefined;
        if (document?.uri.fsPath) {
            const fileState = this._stateManager.get(document?.uri?.fsPath);
            this._metadata = fileState?.metadata;

        }
        this._refreshTree();
    }

    getTreeItem(node: TreeNode<MetaItem>): vscode.TreeItem {
        const item: vscode.TreeItem = {
            label: {
                label: node.data.name
            },
            collapsibleState: node.children.length > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
            description: node.data.description,
            iconPath: this._getIcon(node.data.name, node.data.value?.toString()),
            tooltip: `${node.id}: ${node.data.type}`,
            contextValue: `${node.data.type}`,
            resourceUri: vscode.Uri.parse(`fictionWriter://${MetadataTreeDataProvider.viewType}/#${node.id}`)
        };

        return item;
    }

    public getChildren(element: TreeNode<MetaItem>): TreeNode<MetaItem>[] {
        const children = element?.children ?? this._tree.root.children;
        return children.filter((e) => e.visible);
    }

    private _buildHierarchy(meta: any = this._metadata, parentKey: string = ""): TreeNode<MetaItem>[] {
        if (!meta) {
            return [];
        }
        if (Array.isArray(meta)) {
            return meta.flatMap((arrayItem, index) => {
                const path = parentKey ? `${parentKey}[${index}]` : `[${index}]`;
                return this._buildHierarchy(arrayItem, path);
            });
        } else if (typeof meta === 'object') {
            return Object.keys(meta).flatMap((key) => {
                const item = new MetaItem();
                item.name = key;
                item.key = key;
                item.value = meta[key];
                item.type = MetaNodeType.Key;
                const path = parentKey ? `${parentKey}.${key}` : key;
                const node = new TreeNode(path, item);

                node.children = this._buildHierarchy(item.value, path);
                item.description = node.children.length <= 0 ? '' : node.children.map(c => c.data.name).join(', ') + '';
                if (typeof (item.value) !== 'object') {
                    node.children = [];
                    item.name = key;
                    item.type = MetaNodeType.InlineValue;
                }
                return node;
            });
        } else {
            const path = parentKey;
            const item = new MetaItem();
            item.name = meta.toString();
            item.key = parentKey;
            item.value = meta;
            item.type = MetaNodeType.Value;
            const node = new TreeNode(path, item);
            return [node];
        }
    }

    private _refreshTree() {
        this._tree.clear();
        this._tree.root.children = this._buildHierarchy();
        this._onDidChangeTreeData.fire();
    }

    getSelectedItem(): TreeNode<MetaItem> | undefined {
        return this._treeView.selection ? this._treeView.selection[0] : undefined;
    }

    private _getIcon(key: string, value: string, defaultIcon: string = 'debug-stackframe-dot'): vscode.ThemeIcon | undefined {
        const color = this._resolvers.colorResolver.resolve(value, key.startsWith('color'))
            ?? this._resolvers.colorResolver.resolve(key, true)
            ?? new ThemeColor("foreground");

        return this._resolvers.iconResolver.resolve(value, color, key === 'icon')
            ?? this._resolvers.iconResolver.resolve(key, color)
            ?? new ThemeIcon(defaultIcon, color);
    }

    public async editMetadata(item: TreeNode<MetaItem>) {
        const prevValue = item.data.description?.toString();
        let selectedValue = prevValue;

        if (item.id === 'icon') {
            selectedValue = await selectMetadataIcon(selectedValue);
        } else if (item.id === 'color') {
            selectedValue = await selectMetadataColor(selectedValue);
        } else if (item.id === 'target') {
            selectedValue = await selectMetadataTarget(selectedValue);
        } else {
            selectedValue = await vscode.window.showInputBox({
                title: `${item.id}:`,
                prompt: `Enter new value for metadata key '${item.id}':`,
                value: prevValue
            });
        }

        if (!selectedValue || selectedValue === prevValue) return;

        if (this._document?.uri.fsPath) {
            // TODO(A)
            // await this._stateManager.updateFile(this._document?.uri.fsPath,
            //     (processorFactory) => processorFactory
            //         .createUpdateMetaProcessor(crtMeta => {
            //             this.setPropertyByString(crtMeta, item.id, selectedValue);
            //             // crtMeta[item.id] = selectedValue;
            //             return {...crtMeta};
            //         })
            // );
        }

    }

    private setPropertyByString(obj: any, path: string, value: any) {
        // Split the path into an array of parts
        const parts = path.match(/([^[.\]]+)/g);

        if (parts === null) {
            return;
        }

        let current = obj;

        // Traverse to the second-to-last part of the path
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = isNaN(Number(parts[i + 1])) ? {} : []; // Create array if the next part is an index
            }
            current = current[parts[i]];
        }

        // Set the property value
        current[parts[parts.length - 1]] = value;
    }
}