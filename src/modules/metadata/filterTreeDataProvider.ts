import * as vscode from 'vscode';
import {
    ConfigurationTarget,
    Event,
    EventEmitter,
    FileDecoration,
    FileDecorationProvider,
    ThemeColor,
    ThemeIcon,
    Uri,
    window
} from 'vscode';
import * as path from 'path';
import {DisposeManager} from "../../core/disposable";
import {ContextManager} from '../../core/contextManager';
import {TreeStructure} from '../../core/tree/treeStructure';
import {ColorResolver, IconResolver} from './index';
import * as yaml from 'js-yaml';
import {MetadataOptions} from './metadataOptions';
import {MetadataTreeDataProvider, MetaItem} from './metadataTreeDataProvider';
import {StateManager} from '../../core/state';
import {log} from '../../core';
import {TreeNode} from '../../core/tree/treeNode';

enum FilterItemType {
    Key,
    Value,
    File,
    OtherContainer
}

class MetaFilter {
    exactMatch?: boolean = false;
    expandFiles?: boolean = false;
    value?: string;
}

export class FilterItem {
    name: string = "";
    fsPath: string = '';
    icon?: string;
    description?: string;
    type: FilterItemType = FilterItemType.Key;
    visible: boolean = false;
}

export class FilterTreeDataProvider extends DisposeManager
    implements vscode.TreeDataProvider<TreeNode<FilterItem>>,
        FileDecorationProvider {
    dropMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    dragMimeTypes = ['application/vnd.code.tree.projectExplorerView'];
    private _treeView: vscode.TreeView<TreeNode<FilterItem>>;
    private _onDidChangeTreeData: vscode.EventEmitter<TreeNode<FilterItem> | undefined | null | void> = new vscode.EventEmitter<TreeNode<FilterItem> | undefined | null | void>();
    public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    private readonly _onDidChangeFileDecorations: EventEmitter<Uri | Uri[]> = new EventEmitter<Uri | Uri[]>();
    readonly onDidChangeFileDecorations: Event<Uri | Uri[]> = this._onDidChangeFileDecorations.event;

    public _tree: TreeStructure<FilterItem>;
    private _activeFilter?: MetaFilter;
    private _onChangeMetadataViewSubscription?: vscode.Disposable;
    private readonly TreeViewId = 'fictionWriter.views.metadata.filters';
    constructor(private _options: MetadataOptions, private _stateManager: StateManager, private _contextManager: ContextManager,
                private _metadataView?: MetadataTreeDataProvider,
                private _resolvers?: { iconResolver: IconResolver; colorResolver: ColorResolver }) {
        super();
        this._tree = new TreeStructure(new TreeNode<FilterItem>('root', new FilterItem()));
        this._treeView = vscode.window.createTreeView(this.TreeViewId, {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
            dragAndDropController: this
        });
        this.reload();
        this.setMetadataViewLink(this._contextManager.get("fictionWriter.views.metadata.isLinked", false));

        this.manageDisposable(
            this._treeView,
            window.registerFileDecorationProvider(this),
            this._onDidChangeTreeData,
            this._stateManager.onFilesStateChanged(() => {
                this._refreshTree();
            }),
            this._treeView.onDidCollapseElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, false);
            }),
            this._treeView.onDidExpandElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, true);
            }),
            this._options.onChanged(() => {
                this._refreshTree();
            })
        );
    }


    public getParent(element: TreeNode<FilterItem>): TreeNode<FilterItem> | undefined {
        return element.parent;
    }

    // Tree data provider
    public getChildren(element: TreeNode<FilterItem>): TreeNode<FilterItem>[] {
        const children = element?.children ?? this._tree.root.children;
        return children.filter((e) => e.visible);
    }

    async provideFileDecoration(uri: vscode.Uri): Promise<FileDecoration | undefined> {

        if (uri.authority === 'filters') {

            const id = uri.fragment;
            const element = this._tree.getNode(id);

            if (element) {
                let color = undefined;
                let badge = undefined;
                if (this._options.countBadgesEnabled.value) {
                    badge = element.children.length > 0 ? element.children.length + "" : "";
                    if (badge.length > 2) badge = badge[0] + "+";
                }
                if (element.id === 'root_other' || !element.data.visible) {
                    color = new ThemeColor('descriptionForeground');
                }
                return {
                    badge,
                    color
                };
            }
        }
    }

    public getTreeItem(element: TreeNode<FilterItem>): vscode.TreeItem {
        const item: vscode.TreeItem = new vscode.TreeItem(element.id, vscode.TreeItemCollapsibleState.None);
        const expandAll = this._activeFilter?.expandFiles;
        item.label = {
            label: element.data.name,
            highlights: []
        };
        item.description = element.data.description;
        item.resourceUri = vscode.Uri.parse(`fictionWriter://filters/#${element.id}`);
        switch (element.data.type) {
            case FilterItemType.Key:
                item.tooltip = "";
                item.collapsibleState = expandAll ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                item.contextValue = element.data.visible
                    ? "filterItemMetadataKey"
                    : "filterItemMetadataKeyHidden";
                item.iconPath = this._getIcon(element.data.icon);
                break;
            case FilterItemType.Value:
                item.tooltip = "";
                item.collapsibleState = expandAll ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                item.contextValue = "filterItemMetadataValue";
                item.iconPath = undefined;//this._getIcon(element.data.icon);
                break;
            case FilterItemType.File:
                item.collapsibleState = vscode.TreeItemCollapsibleState.None;
                item.contextValue = "filterItemMetadataFileLink";
                if (element.data.fsPath) {
                    item.command = {
                        title: 'Open',
                        command: 'vscode.open',
                        arguments: [vscode.Uri.parse(element.data.fsPath)]
                    };
                }
                item.label = "\u30FB";
                item.description = element.data.name;
                item.tooltip = element.data.fsPath;
                item.iconPath = undefined;// new ThemeIcon('file-symlink-file');
                break;
            case FilterItemType.OtherContainer:
                item.tooltip = "Other tags...";
                item.collapsibleState = expandAll ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                item.contextValue = "filterItemMetadataOthers";
                item.iconPath = new ThemeIcon(element.data.icon ?? 'ellipsis');
                break;
        }

        return item;
    }

    private _getIcon(value?: string, defaultIcon: string = 'symbol-constant'): vscode.ThemeIcon | undefined {
        const color = this._resolvers?.colorResolver.resolve(value) ?? new ThemeColor("foreground");
        return this._resolvers?.iconResolver.resolve(value, color) ?? new ThemeIcon(defaultIcon, color);
    }

    public reload(): void {
        this._refreshTree();
    }


    private _globalMetadata() {
        const metadata = new Map<string, { value: any, files: { fsPath: string, name?: string }[] }[]>();
        for (const state of this._stateManager.trackedFiles) {
            if (state?.metadata?.value) {
                for (const [key, value] of Object.entries(state.metadata?.value)) {
                    const values = Array.isArray(value) ? value : [value];

                    const crtValues = metadata.get(key) ?? [];
                    for (const v of values) {
                        const vStr = yaml.dump(v, {
                            noRefs: true, condenseFlow: true, flowLevel: 1,
                            noArrayIndent: true, indent: 0
                        }).replace(/\n/g, " ");
                        const entry = crtValues.find(val => val.value === vStr);
                        const item = state?.fwItem;
                        if (!item) continue;
                        if (entry) {
                            entry.files.push({fsPath: item.ref.fsPath, name: item.ref.name});
                        } else {
                            crtValues.push({value: vStr, files: [{fsPath: item.ref.fsPath, name: item.ref.name}]});
                        }
                    }
                    metadata.set(key, crtValues);
                }
            }
        }

        return metadata;
    }

    public _refreshTree() {
        this._tree.clear();
        const otherItem = new FilterItem();
        otherItem.icon = 'ellipsis';
        otherItem.name = '';
        otherItem.type = FilterItemType.OtherContainer;
        const otherNode = new TreeNode<FilterItem>('root_other', otherItem);

        for (const [key, values] of this._globalMetadata()) {
            const data = new FilterItem();
            data.name = key;
            data.description = "";
            data.type = FilterItemType.Key;
            data.fsPath = "";
            data.icon = key;
            let node = new TreeNode<FilterItem>(key, data);
            data.visible = this._isVisible(key);
            if (data.visible) {
                this._tree.insertLast(node);
            } else {
                this._tree.addChild(node, otherNode);
            }

            for (const valueItem of values) {
                const valueData = new FilterItem();
                valueData.name = valueItem.value.toString().trim();
                valueData.description = "";
                valueData.type = FilterItemType.Value;
                valueData.fsPath = "";
                valueData.icon = undefined;
                let child = new TreeNode<FilterItem>(node.id + valueItem.value.toString(), valueData);
                this._tree.addChild(child, node);
                for (const file of valueItem.files) {
                    const fileData = new FilterItem();
                    fileData.name = file.name ?? path.basename(file.fsPath);
                    fileData.description = "";
                    fileData.type = FilterItemType.File;
                    fileData.fsPath = file.fsPath;
                    let fileChild = new TreeNode<FilterItem>(child.id + file.fsPath, fileData);
                    this._tree.addChild(fileChild, child);
                }
            }
        }

        if (otherNode.children.length > 0) {
            otherNode.data.description = "";
            this._tree.insertLast(otherNode);
        }
        this._fireEvents();
        //  this.refreshFilter();
    }

    private _fireEvents() {
        this._onDidChangeFileDecorations.fire(this._tree.toList().map((e) => vscode.Uri.parse(`fictionWriter://filters/#${e.id}`)));
        this._onDidChangeTreeData.fire();
    }

    private _isVisible(key: string) {
        return this._contextManager.get("filter_" + key, true);
    }

    private _hideFilter(key: string) {
        return this._contextManager.set("filter_" + key, false);
    }

    private _showFilter(key: string) {
        return this._contextManager.set("filter_" + key, true);
    }

    public toggleFilter(key: string) {
        if (this._isVisible(key)) {
            this._hideFilter(key).then(() => this._refreshTree());
        } else {
            this._showFilter(key).then(() => this._refreshTree());
        }
        this.reload();
    }

    private async _filter(filter: MetaFilter | undefined) {
        this._activeFilter = filter;
        const toBeReviled: TreeNode<FilterItem>[] = [];
        const filterExactMatch = (values: string[], node: TreeNode<FilterItem>) => {
            return values.filter(v => node.data.name == v || node.data.description == v).length > 0;
        };
        const filterAnyMatch = (values: string[], node: TreeNode<FilterItem>) => values.filter(v => node.data.name.toLowerCase().indexOf(v) > -1).length > 0;
        const filterFunc = filter?.exactMatch
            ? filterExactMatch
            : filterAnyMatch;

        if (!filter?.value) {
            this._tree.toggleChildren(this._tree.root, true);
            this._treeView.description = undefined;
        } else if (filter?.value.length > 1) {
            this._treeView.description = `Filter: ${filter.value}`;
            this._tree.toggleChildren(this._tree.root, false);
            this._onDidChangeTreeData.fire();
            const values =
                filter?.exactMatch
                    ? [filter.value]
                    : filter.value.toLowerCase().split(/[,\s]/).map((v) => v.trim()).filter((v) => v.length > 1);
            for (const node of this._tree.toList()) {

                if (filterFunc(values, node)) {
                    try {
                        this._tree.toggleParent(node, true);
                        this._tree.toggleChildren(node, true);
                        toBeReviled.push(node);
                    } catch (err) {
                        console.warn(err);
                    }
                }
            }
        }

        for (const toReveal of toBeReviled) {
            await this._treeView.reveal(toReveal, {select: false, focus: false, expand: false});
        }
        this._onDidChangeTreeData.fire();
    }

    public async addFilter(value?: MetaFilter, options?: MetadataOptions) {
        if (!value) return this.removeFilter();

        vscode.commands.executeCommand('setContext', 'fictionWriter.views.metadata.hasFilter', true);
        this._contextManager.set("fictionWriter.views.metadata.filter", value);
        this._filter(value);
    }

    public async removeFilter() {
        vscode.commands.executeCommand('setContext', 'fictionWriter.views.metadata.hasFilter', false);
        this._contextManager.remove("fictionWriter.views.metadata.filter");
        vscode.commands.executeCommand(`workbench.actions.treeView.${this.TreeViewId}.collapseAll`);
        await this._filter(undefined);
    }

    public async refreshFilter() {
        const value = await this._contextManager.get("fictionWriter.views.metadata.filter", undefined);
        if (value) {
            await this.addFilter(value);
        } else {
            await this.removeFilter();
        }
    }

    public async setFilter() {
        const value = await vscode.window.showInputBox({
            "title": "Search",
            "prompt": "Search for metadata",
            "validateInput": (value) => {
                this._filter({value});
                return null;
            }
        });
        if (value) {
            this.addFilter({value});
        } else {
            this.removeFilter();
        }
    }
    public async setMetadataViewLink(isLinked: boolean) {
        vscode.commands.executeCommand('setContext', 'fictionWriter.views.metadata.isLinked', isLinked);
        this._contextManager.set("fictionWriter.views.metadata.isLinked", isLinked);
        if (!this._metadataView) return;

        const applyFilter = (e: TreeNode<MetaItem> | undefined) => {
            // TODO: make MetadataTreeItem a TreeItem<MetadataItem> so we can trace back parent
            let filter = e?.data.name;
            if (e?.data.description && (!e?.children || e.children.length === 0)) {
                filter = e.data.description.toString();
            }
            this.addFilter({value: filter, exactMatch: true, expandFiles: true});
        };

        if (!isLinked) {
            this.removeFilter();
        } else {
            applyFilter(this._metadataView.getSelectedItem());
        }

        this._onChangeMetadataViewSubscription?.dispose();
        this._onChangeMetadataViewSubscription = this._metadataView.onDidChangeSelection((e) => {
           if (!e) return;

            if (isLinked) {
                applyFilter(e);
            }
        });
    }

    public async toggleMetadataViewLink() {
        let isLinked = this._contextManager.get("fictionWriter.views.metadata.isLinked", false);
        await this.setMetadataViewLink(!isLinked);
    }
}

