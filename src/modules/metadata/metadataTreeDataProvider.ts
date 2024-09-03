import * as vscode from 'vscode';
import {FileDecoration, ThemeColor, ThemeIcon, Uri} from 'vscode';
import {IMetaState, Metadata} from '../../core/processors';
import {MetadataOptions} from './metadataOptions';
import {ColorResolver, IconResolver} from './iconsAndColors';
import {StateManager} from '../../core/state';
import {selectMetadataColor, selectMetadataIcon, selectMetadataTarget} from './inputBoxes';
import {DisposeManager} from '../../core';

export class MetadataTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<MetadataTreeItem> {
    public static readonly viewType = 'fictionWriter.views.metadata';
    private _treeView: vscode.TreeView<MetadataTreeItem>;
    private _document: vscode.TextDocument | undefined;
    private _metadata: IMetaState | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataTreeItem | undefined | null | void> = new vscode.EventEmitter<MetadataTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MetadataTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    // EventEmitter and Event for selection changes
    private _onDidChangeSelection: vscode.EventEmitter<MetadataTreeItem | undefined> = new vscode.EventEmitter<MetadataTreeItem | undefined>();
    public readonly onDidChangeSelection: vscode.Event<MetadataTreeItem | undefined> = this._onDidChangeSelection.event;

    constructor(private _options: MetadataOptions,
                private _stateManager: StateManager,
                private _resolvers: {
                    iconResolver: IconResolver;
                    colorResolver: ColorResolver,
                }) {
        super();

        this._loadDocument(vscode.window.activeTextEditor?.document);

        this._treeView = vscode.window.createTreeView(MetadataTreeDataProvider.viewType, {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            // dragAndDropController: this
        });

        this.manageDisposable(
            this._treeView,
            vscode.window.onDidChangeActiveTextEditor((e) => {
                this._loadDocument(e?.document);
            }),
            this._stateManager.onFilesStateChanged(e => {
                if (e.files.map(f => f.state.fileInfo?.fsPath).includes(this._document?.uri.fsPath)) {
                    this._loadDocument(this._document);
                }
            }),
            this._treeView.onDidCollapseElement((e) => {
                if (e.element.children) {
                    e.element.description = `${e.element.children.map(c => c.title).join(', ')}`;
                }
                this._onDidChangeTreeData.fire(e.element);
            }),
            this._treeView.onDidExpandElement((e) => {
                if (e.element.children) {
                    e.element.description = '';
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
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MetadataTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {
        if (element) {
            return Promise.resolve(element.children);
        } else {
            const all = this.getChildItems();

            return Promise.resolve(all);
        }
    }

    getSelectedItem(): MetadataTreeItem | undefined {
        return this._treeView.selection ? this._treeView.selection[0] : undefined;
    }

    private getChildItems(meta: any = this._metadata?.value, parentKey: string = ''): MetadataTreeItem[] {
        if (!meta) {
            return [];
        }

        if (typeof meta === 'object' && !Array.isArray(meta)) {
            return Object.keys(meta).map((key) => {
                const value = meta[key];
                const newKey = parentKey ? `${parentKey}.${key}` : key;
                if (typeof value === 'object') {
                    const children = this.getChildItems(value, newKey);
                    const desc = children.length <= 0 ? '' : children.map(c => c.title).join(', ') + '';
                    return new MetadataTreeItem(newKey, key,
                        desc,
                        value && Object.keys(value).length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                        children,
                        this._getIcon(key, desc, Array.isArray(value) ? 'array' : 'symbol-object'),
                        false
                    );
                } else {
                    return new MetadataTreeItem(newKey, key, value + '', vscode.TreeItemCollapsibleState.None, undefined,
                        this._getIcon(key, value),
                        true);
                }
            });
        } else if (Array.isArray(meta)) {
            return meta.map((item, index) => {
                const newKey = `${parentKey}[${index}]`;
                if (typeof item === 'object') {
                    const children = this.getChildItems(item, newKey);
                    const desc = children.length <= 0 ? '' : children.map(c => c.title).join(', ') + '';
                    return new MetadataTreeItem(newKey, newKey,
                        desc,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        children,
                        this._getIcon(newKey, desc, Array.isArray(item) ? 'array' : 'symbol-object'),
                        false);
                } else {
                    return new MetadataTreeItem(newKey, item, '', vscode.TreeItemCollapsibleState.None, undefined, this._getIcon(newKey, item),
                        false);
                }
            });
        } else {
            return [new MetadataTreeItem(parentKey, meta, '', vscode.TreeItemCollapsibleState.None, undefined, this._getIcon(parentKey, meta),
                true)];
        }
    }

    private _getIcon(key: string, value: string, defaultIcon: string = 'debug-stackframe-dot'): vscode.ThemeIcon | undefined {
        const color = this._resolvers.colorResolver.resolve(value, key.startsWith('color'))
            ?? this._resolvers.colorResolver.resolve(key, true)
            ?? new ThemeColor("foreground");

        return this._resolvers.iconResolver.resolve(value, color, key === 'icon')
            ?? this._resolvers.iconResolver.resolve(key, color)
            ?? new ThemeIcon(defaultIcon, color);
    }

    public async editMetadata(item: MetadataTreeItem) {
        const prevValue = item.description?.toString();
        let selectedValue = prevValue;

        if (item.id === 'icon'){
            selectedValue = await selectMetadataIcon(selectedValue);
        } else if (item.id === 'color'){
            selectedValue = await selectMetadataColor(selectedValue);
        } else if (item.id === 'target'){
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
            await this._stateManager.updateFile(this._document?.uri.fsPath,
                (processorFactory) => processorFactory
                    .createUpdateMetaProcessor(crtMeta => {
                        crtMeta[item.id] = selectedValue;
                        return {...crtMeta};
                    })
            );
        }

    }
}


export class MetadataTreeItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly title: string,
        private subtitle: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children: MetadataTreeItem[] = [],
        public icon: ThemeIcon | undefined,
        public editable: boolean) {
        super(title, collapsibleState);
        this.id = id;
        this.description = this.subtitle;
        this.contextValue = editable ? 'editable' : 'readonly';
        this.iconPath = icon;
        this.resourceUri = vscode.Uri.parse(`fictionWriter://${MetadataTreeDataProvider.viewType}/#${id}`);
        this.tooltip = this.resourceUri.toString();
    }

    public static provideFileDecoration(uri: Uri): FileDecoration | undefined {
        if (uri?.authority !== MetadataTreeDataProvider.viewType) return;
        return {
            badge: "",
            color: new ThemeColor("#569cd6"),

            // color: new vscode.ThemeColor("tab.activeBackground"),
            // tooltip: ""
        };
    }

}
