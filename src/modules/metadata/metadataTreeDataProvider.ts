import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {FileDecoration, ThemeColor, ThemeIcon, Uri} from 'vscode';
import {DisposeManager, FileManager} from '../../core';
import {InputFileProcessor} from '../../processors/inputFileProcessor';
import {Node} from '../../core/tree/node';
import {Metadata} from '../../processors';
import {MetadataOptions} from './metadataOptions';
import {MetadataTreeDecorationProvider} from './metadataDecoration';
import {ColorResolver, IconResolver} from './iconsAndColors';

export class MetadataTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<MetadataTreeItem> {
    public static readonly viewType = 'fictionWriter.views.metadata';
    private _treeView: vscode.TreeView<MetadataTreeItem>;
    private _document: vscode.TextDocument | undefined;
    private _metadata: Metadata | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataTreeItem | undefined | null | void> = new vscode.EventEmitter<MetadataTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MetadataTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    // EventEmitter and Event for selection changes
    private _onDidChangeSelection: vscode.EventEmitter<MetadataTreeItem | undefined> = new vscode.EventEmitter<MetadataTreeItem | undefined>();
    public readonly onDidChangeSelection: vscode.Event<MetadataTreeItem | undefined> = this._onDidChangeSelection.event;

    constructor(private _options: MetadataOptions, private _resolvers: {
        iconResolver: IconResolver;
        colorResolver: ColorResolver
    }) {
        super();

        this._loadDocument(vscode.window.activeTextEditor?.document);

        this._treeView = vscode.window.createTreeView(MetadataTreeDataProvider.viewType, {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            // dragAndDropController: this
        });

        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.manageDisposable(
            watcher,
            this._treeView,
            vscode.window.onDidChangeActiveTextEditor((e) => {
                this._loadDocument(e?.document);
            }),
            watcher.onDidChange((e) => {
                if (e.fsPath === this._document?.uri.fsPath) {
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
        this._metadata = new InputFileProcessor(document?.getText() ?? "").metadata;
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
                    return new MetadataTreeItem(newKey, key,
                        children.length <= 0 ? '' : children.map(c => c.title).join(', ') + '',
                        value && Object.keys(value).length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                        children,
                        this._getIcon(key, Array.isArray(value) ? 'array' : 'symbol-object')
                    );
                } else {
                    return new MetadataTreeItem(newKey, key, value + '', vscode.TreeItemCollapsibleState.None, undefined, this._getIcon(key));
                }
            });
        } else if (Array.isArray(meta)) {
            return meta.map((item, index) => {
                const newKey = `${parentKey}[${index}]`;
                if (typeof item === 'object') {
                    const children = this.getChildItems(item, newKey);

                    return new MetadataTreeItem(newKey, newKey,
                        children.length <= 0 ? '' : children.map(c => c.title).join(', ') + '',
                        vscode.TreeItemCollapsibleState.Collapsed,
                        children,
                        this._getIcon(newKey, Array.isArray(item) ? 'array' : 'symbol-object'));
                } else {
                    return new MetadataTreeItem(newKey, item, '', vscode.TreeItemCollapsibleState.None, undefined, this._getIcon(item));
                }
            });
        } else {
            return [new MetadataTreeItem(parentKey, meta, '', vscode.TreeItemCollapsibleState.None, undefined, this._getIcon(meta))];
        }
    }

    private _getIcon(value: string, defaultIcon: string = 'debug-stackframe-dot'): vscode.ThemeIcon | undefined {
        const color = this._resolvers.colorResolver.resolve(value) ?? new ThemeColor("foreground");
        console.log(color);
        return this._resolvers.iconResolver.resolve(value, color) ?? new ThemeIcon(defaultIcon, color);
    }
}


export class MetadataTreeItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly title: string,
        private subtitle: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children: MetadataTreeItem[] = [],
        public icon: ThemeIcon | undefined) {
        super(title, collapsibleState);
        this.id = id;
        this.description = this.subtitle;
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
