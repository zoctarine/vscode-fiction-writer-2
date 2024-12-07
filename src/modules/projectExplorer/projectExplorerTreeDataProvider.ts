import * as vscode from 'vscode';
import {TreeItemCheckboxState} from 'vscode';
import {
    DisposeManager,
    FactorySwitch,
    FictionWriter,
    FwFileManager,
    FwInfo,
    FwPermission,
    FwProjectFileItem,
    FwSubType,
    FwType,
    FwVirtualFolderItem,
    log,
    Permissions,
    TreeNode,
    TreeStructure
} from "../../core";
import {ContextManager} from '../../core/contextManager';
import {
    ProjectExplorerBackItem,
    ProjectExplorerListItem,
    ProjectExplorerTreeItem
} from './models/projectExplorerTreeItem';
import {ProjectsOptions} from './projectsOptions';
import {IDecorationState, IFileState, StateManager} from '../../core/state';
import {AllFilesFilter, IFileFilter, OnlyProjectFilesFilter} from './models/filters';
import rfdc from 'rfdc';
import {BackProjectNode, ProjectNode, ProjectNodeList} from './models/projectNode';
import {ObjectProps} from '../../core/lib';
import {IProjectContext, ProjectView} from './models/IProjectContext';
import {IProjectViewContext} from './models/IProjectViewContext';
import {Context} from '../../core/lib/context';
import {FwItem, FwItemRoot} from '../../core/fwFiles/FwItem';
import {ProjectNodeViewContextBuilder} from './models/ProjectNodeViewContextBuilder';
import {ProjectViewContextBuilder} from './models/ProjecViewContextBuilder';


const clone = rfdc();
const action = {
    none: undefined,
    ordering: 'ordering',
    compiling: 'compiling',
    refreshing: 'refreshing',
};

export class ProjectExplorerTreeDataProvider
    extends DisposeManager
    implements vscode.TreeDataProvider<ProjectNode>,
        vscode.TreeDragAndDropController<ProjectNode> {
    dropMimeTypes = ['application/vnd.code.tree.projectexplorerview'];
    dragMimeTypes = ['application/vnd.code.tree.projectexplorerview'];
    private _treeView: vscode.TreeView<ProjectNode>;
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectNode | undefined | null | void> = new vscode.EventEmitter<ProjectNode | undefined | null | void>();
    // We want to use an array as the event type, but the API for this is currently being finalized. Until it's finalized, use any.
    public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    public _treeStructure: TreeStructure<IFileState>;
    private _navigationRoot: TreeNode<IFileState> | undefined;
    private _fileFilter: IFileFilter = OnlyProjectFilesFilter;
    private _ctx: IProjectContext = {
        decoration: 'decoration1',
        filter: 'projectFiles',
        is: undefined,
        multiselect: undefined,
        syncEditor: false,
        showExtension: false,
        showOrder: false,
        projectView: ProjectView.tree,
        navigationRoot: undefined,
    };
    public selectedItems: FwItem[] = [];

    private _viewModel: IProjectViewContext = {
        compileCommit: false,
        compileDiscard: false,
        compileStart: false,
        decoration: '',
        filter: '',
        newFile: false,
        newFolder: false,
        orderCommit: false,
        orderDiscard: false,
        orderDown: false,
        orderStart: false,
        orderUp: false,
        refresh: false,
        sync: '',
        showExtension: '',
        showOrder: '',
        back: false,
        projectView: undefined,
    };

    constructor(
        private _options: ProjectsOptions,
        private _fileManager: FwFileManager, private _contextManager: ContextManager, private _stateManager: StateManager) {
        super();
        this._treeStructure = new TreeStructure<IFileState>(
            new ProjectNode('root', {fwItem: new FwItemRoot()}));
        this._treeView = vscode.window.createTreeView(FictionWriter.views.projectExplorer.id, {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: true,
            dragAndDropController: this,
            manageCheckboxStateManually: true,
        });

        this.manageDisposable(
            this._treeView,
            this._onDidChangeTreeData,
            this._options.fileDescriptionMetadataKey.onChanged(v => {
                return this.refresh();
            }),
            this._stateManager.onFilesStateChanged((e) => {
                this.refresh(); // TODO: Improve this, to not overlap with onFilesChanged
            }),
            this._treeView.onDidCollapseElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, false);
            }),
            this._treeView.onDidExpandElement((e) => {
                this._contextManager.set("tree_expanded_" + e.element.id, true);
            }),
            this._treeView.onDidChangeSelection((e) => {
                this.selectedItems = e.selection?.map(s => s.data.fwItem).filter(f => f !== undefined) ?? [];
                if (e.selection?.length > 1) {
                    return this.setCtx({multiselect: true});
                }
                if (e.selection?.length === 1) {
                    return this.setCtx({multiselect: false});
                } else {
                    return this.setCtx({multiselect: undefined});
                }
            }),

            this._treeView.onDidChangeCheckboxState(e => {
                for (let [node, state] of e.items) {
                    node.checked = state === TreeItemCheckboxState.Checked;
                }
            }),
            vscode.window.onDidChangeActiveTextEditor(e => {
                this._handleActiveTextEditorChanged(e);
            })
        );

        this.loadCtx()
            .then(() => {
                this._fileFilter = this._ctx.filter === 'projectFiles' ? OnlyProjectFilesFilter : AllFilesFilter;
                if (this._ctx.navigationRoot) {
                    this._setNavigationRoot(this._treeStructure.getNode(this._ctx.navigationRoot));
                }
            })

            .then(() => this.refresh());
    }

    private arrangeWorkspaces() {
        const workspaces: ProjectNode[] = [];
        const collectWorkspaces = (node: ProjectNode, workspaces: ProjectNode[]) => {
            if (node.data.fwItem?.info?.subType === FwSubType.WorkspaceFolder) {
                workspaces.push(node);
            } else if (node.children?.length > 0) {
                for (const child of node.children) {
                    collectWorkspaces(child as ProjectNode, workspaces);
                }
            }

        };

        const root = this._treeStructure.root;
        collectWorkspaces(root as ProjectNode, workspaces);

        root.children.forEach((child) => {
            this._treeStructure.detach(child);
        });
        for (const child of workspaces) {
            this._treeStructure.addChild(child, root);
        }
    }

    private printTree(node: ProjectNode, indent: string) {
        log.tmp(indent + node.id);
        for (const child of node.children) {
            this.printTree(child as ProjectNode, indent + "  ");
        }
    }

    private async buildHierarchy(states: IFileState[]) {
        const tree = new TreeStructure<IFileState>(new ProjectNode('root', {fwItem: new FwItemRoot()}));
        const workspaces: ProjectNode[] = [];

        // order files by parent, so we include the full hierarchy
        states.sort((a, b) => a?.fwItem?.parent?.localeCompare(b?.fwItem?.parent ?? '') ?? 0);
        for (const state of states) {
            if (!state.fwItem?.fsRef) continue;
            const current = state.fwItem.fsRef.fsPath;
            const parent = state.fwItem.parent;

            let currentNode = tree.getNode(current);
            let parentNode = parent ? tree.getNode(parent) : tree.root;
            if (!currentNode) {
                currentNode = new ProjectNode(current, {fwItem: state.fwItem});
            }
            if (parentNode) {
                tree.addChild(currentNode, parentNode);
            }

            currentNode.data = state;
            currentNode.visible = this._fileFilter.check(state.fwItem?.info);
            if (currentNode.data.fwItem?.info.subType === FwSubType.WorkspaceFolder) {
                workspaces.push(currentNode as ProjectNode);
            }
        }

        this._treeStructure = tree;

        // TODO: optimize workspace folder filtering) and virtual folder building
        //       should be more efficient for larger implementation. (current draft)
        this.arrangeWorkspaces();
    }

    public getParent(element: ProjectNode): ProjectNode | undefined {
        return element.parent as ProjectNode | undefined;
    }

    public getChildren(element: ProjectNode): ProjectNode[] {
        if (this._ctx.projectView === ProjectView.list) {
            if (this._navigationRoot) {
                element = this._navigationRoot as ProjectNode;
            } else if (element) {
                return [];
            }
        }

        const root = this._navigationRoot ?? this._treeStructure.getRoot();

        const children = (element
                ? this._treeStructure.getNode(element.id)?.children
                : root.children)
            ?? [];

        const result = new ProjectNodeList(children as ProjectNode[])
            .filter()
            .sort()
            .items;

        if (this._ctx.projectView === ProjectView.list) {
            if (this._navigationRoot && this._navigationRoot.id!== 'root') {
                result.unshift(new BackProjectNode());
            }
        }
        return result;
    }


    public getTreeItem(element: ProjectNode): vscode.TreeItem {
        if (element.id === 'back') {
            const back = new ProjectExplorerBackItem();
            return back;
        }

        const node = this._treeStructure.getNode(element.id);
        if (!node) return {};

        const metaDesc = node.data.metadata && this._options?.fileDescriptionMetadataKey.value
            ? node.data.metadata[this._options.fileDescriptionMetadataKey.value]
            : null;

        const overwrittenMetaDecoration = metaDesc
            ? {
                description: metaDesc,
            } : {};
        const additionalDecoration =
            this._ctx.is === action.ordering
                ? node.data.orderDecorations
                : this._ctx.is === action.compiling
                    ? node.data.securityDecorations
                    : {};

        const itemType = this._ctx.projectView === ProjectView.list
            ? ProjectExplorerListItem : ProjectExplorerTreeItem;

        const item = new itemType(node as ProjectNode, {
            expanded: this._contextManager.get("tree_expanded_" + element.id, false),
            contextBuilder: () => ({}),
            decorationsSelector: (s) =>
                new FactorySwitch<(IDecorationState | undefined)[]>()
                    .case(this._ctx.decoration === 'decoration1', () => [s.writeTargetsDecorations, s.metadataDecorations, overwrittenMetaDecoration, additionalDecoration])
                    .case(this._ctx.decoration === 'decoration2', () => [s.metadataDecorations, overwrittenMetaDecoration, additionalDecoration])
                    .case(this._ctx.decoration === 'decoration3', () => [s.textStatisticsDecorations, s.writeTargetsDecorations, additionalDecoration])
                    .case(this._ctx.decoration === 'decoration4', () => [s.datetimeDecorations, additionalDecoration])
                    .case(this._ctx.decoration === 'decoration5', () => [additionalDecoration])
                    .create()
        });

        item.contextValue = Context.serialize(
            new ProjectNodeViewContextBuilder().build({node: node as ProjectNode, ctx: this._ctx}));

        return item;
    }

    public async toggleVirtualFolder(node: ProjectNode): Promise<void> {
        if (node.data.fwItem?.info?.subType === FwSubType.ProjectFile) {
            FwInfo.morph(node.data.fwItem.info, FwVirtualFolderItem);
            this._onDidChangeTreeData.fire();
        } else if (node.data.fwItem?.info?.subType === FwSubType.VirtualFolder) {
            if (node.children?.length === 0) {
                FwInfo.morph(node.data.fwItem.info, FwProjectFileItem);
                this._onDidChangeTreeData.fire();
            } else {
                vscode.window.showInformationMessage("Cannot break a virtual folder with children", {
                    modal: true
                });
            }
        }
    }

    public async addFile(node: ProjectNode) {
        //
        // node = node ?? this._treeView.selection[0];
        // const ref = node.data.fwItem?.info;
        // if (!ref) return;
        //
        // const fn = new FwFileNameParser(new DefaultOrderParser());
        // const fs = new FsPathParser();
        //
        // const filePath = await fs.serializeAsync(fn);
        //
        // const makeFinalPath = (value: string) => fwPath.join(ref.fsPath, value);
        //
        // const baseName = 'Scene';
        // let fileName = retry<string>((cnt) => {
        //     if (!fwPath.exists(makeFinalPath('Chapter' + (cnt + 1)))) {
        //         return baseName + (cnt + 1);
        //     }
        // }) ?? baseName;
        //
        //
        // if (Permissions.check(ref, FwPermission.AddChildren)) {
        //     // TODO: add retry?
        //     const value = await vscode.window.showInputBox({
        //         title: `Add file`,
        //         prompt: `File name:`,
        //         valueSelection: [0, fileName.length],
        //         value: filePath,
        //         validateInput: async (value: string) => {
        //             if (!value || value === '') {
        //                 return {
        //                     message: "Value must be a valid name",
        //                     severity: InputBoxValidationSeverity.Error
        //                 };
        //             }
        //
        //             if (fwPath.exists(makeFinalPath(value))) {
        //                 return {
        //                     message: "The file name already exists",
        //                     severity: InputBoxValidationSeverity.Error
        //                 };
        //             }
        //         }
        //     });
        //     if (value) {
        //         const fsPath = fwPath.join(ref.fsPath, value);
        //         const created = await this._fileManager.createFile(fsPath, "");
        //         if (!created) {
        //             notifier.warn(`Could not create file: ${value}`);
        //         }
        //     }
        // }
    }


    // private _addNewChild(node: ProjectNode | undefined, type: FwSubType = FwSubType.ProjectFile): void {
    //     if (!node) return;
    //     const newNode = new ProjectNode('new' + Math.random(), new ProjectItem());
    //     newNode.type = type;
    //     newNode.item.name = "new";
    //     newNode.item.ext = this._options.trackingTag.value ? `.${this._options.trackingTag.value}` : '';
    //     if (type === FwSubType.ProjectFile) {
    //         newNode.item.ext += '.md';
    //     }
    //
    //     this._insert(newNode, node);
    //     newNode.id = newNode.buildFsPath();
    //     newNode.item.fsName = newNode.item.buildFsName();
    //     this._treeView.reveal(newNode, {select: true, focus: true, expand: true});
    //     if (type === FwSubType.Folder) {
    //         vscode.workspace.fs.createDirectory(vscode.Uri.parse(newNode.id))
    //             .then(() => {
    //                 this.refresh();
    //             });
    //     } else {
    //         vscode.workspace.fs.writeFile(vscode.Uri.parse(newNode.id), new Uint8Array(0))
    //             .then(() => {
    //                 this.refresh();
    //             });
    //     }
    // }

    private _tryMoveToChildren(source: ProjectNode, dest?: ProjectNode): boolean {
        // TODO
        // if (!source?.isDraggable) return false; // cannot move the root
        // if (!dest?.parent) return false;  // cannot move a file to
        // if (dest.id.startsWith(source.id)) return false; // cannot move into itself
        //
        // if (source.parent !== dest && dest.acceptsChild(source)) {     // move to a different parent
        //     source.parent?.children?.delete(source.id);
        //     source.parent = dest;
        //     dest.children?.set(source.id, source);
        // }

        return true;
    }

    // Drag and drop controller
    public async handleDrop(target: ProjectNode | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        if (token.isCancellationRequested) return;
        //TODO
        // const transferItem = sources.get('application/vnd.code.tree.projectexplorerview');
        // if (!transferItem) return; // nothing to drop
        // const source = this._tree.getNode(transferItem.value[0]?.id ?? "");
        // const dest = this._tree.getNode(target?.id ?? "");
        // this._insert(source, dest);


        // if (!this._isBatchOrderingEnabled) {
        //     this.commit();
        // }
    }

    // TODO
    // private _insert(source?: ProjectNode, dest?: ProjectNode) {
    //     if (!source || !dest) return; // don't know what to move where
    //     if (!source.isDraggable) return; // cannot move
    //     if (source === dest) return; // no need to move
    //
    //     // find first acceptable position
    //     if (dest.acceptsChild(source)) {
    //         if (!this._tryMoveToChildren(source, dest)) return;
    //     } else {
    //         if (!this._tryMoveToChildren(source, dest.parent as ProjectNode | undefined)) return;
    //     }
    //
    //     // Reorder source siblings (wherever it ended up)
    //     const items = this._mixFoldersAndFiles
    //         ? this._tree.getSiblings(source)
    //         : this._tree.getMatchingSiblings(source);
    //     const siblings = items
    //         .map(a => ({id: a.id, order: a.item.order}))
    //         .sort((a, b) => a.order - b.order);
    //
    //     new OrderHandler(siblings)
    //         .reorder(source.id, dest?.id ?? "")
    //         .get()
    //         .forEach(e => {
    //             const item = this._tree.getNode(e.id);
    //             if (item) {
    //                 item.item.order = e.order;
    //             }
    //         });
    //
    //     this._onDidChangeTreeData.fire();
    // }

    public reorderAll() {
        // this._reorderAll(this._tree.root);
        // this.commit();
        // //   this._onDidChangeTreeData.fire();

    }

    public _reorderAll(root: ProjectNode) {
        // const siblings = [...root.children?.values() ?? []]
        //     .map(a => ({id: a.id, order: a.item.order}));
        // let list: string[] = [];
        // new OrderHandler(siblings)
        //     .redistributeAll()
        //     .get()
        //     .forEach(e => {
        //         const item = this._tree.getNode(e.id);
        //         list.push(`${e.id} ${e.order}`);
        //         if (item) {
        //             item.item.order = e.order;
        //         } else {k
        //             console.log(`Cannot find ${e.id}`);
        //         }
        //     });
        // console.log(list);
        // root.children?.forEach(child => {
        //     this._reorderAll(child as ProjectNode);
        // });
    }


    public enableOrdering() {

        this.setCtx({is: action.ordering})
            .then(() => {
                this._treeView.description = "Reordering";
                return this.refresh();
            });
    }


    public async disableOrdering(discardChanges: boolean = true) {
        this.setCtx({is: undefined})
            .then(() => {
                this._treeView.description = "";
                if (discardChanges) return this.refresh();
            });
    }

    public async commitOrdering() {
        await this.disableOrdering(false);
        this.commit();
    }

    public async redistribute(node: ProjectNode) {
        // if (node?.children?.size) {
        //     let idx = 1;
        //     for (let child of node.children.values()) {
        //         if (child.item) child.item.order = idx++;
        //     }
        //     this._onDidChangeTreeData.fire();
        // }
    }

    public showNextFor(decoration: string) {
        const decorations = ['decoration1', 'decoration2', 'decoration3', 'decoration4', 'decoration5'];
        const crt = decorations.indexOf(decoration);
        let next = 0;
        if (crt >= 0) {
            next = (crt + 1) % decorations.length;
        }
        this.setCtx({decoration: decorations[next]}, true)
            .then(() => {
                this.refresh();
            });
    }

    public syncWithActiveEditorOn() {
        this.setCtx({syncEditor: true}, true)
            .then(() => {
                this._handleActiveTextEditorChanged(vscode.window.activeTextEditor);
            });
    }

    public syncWithActiveEditorOff() {
        this.setCtx({syncEditor: false}, true);
    }

    public async handleDrag(source: ProjectNode[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        // if (!source[0]?.isDraggable) return;
        // if (!this._isBatchOrderingEnabled) return;
        // treeDataTransfer.set('application/vnd.code.tree.projectexplorerview', new vscode.DataTransferItem(source));
    }


    public refresh() {
        log.tmp("REFRESHING")
        const fwItems = this._stateManager.trackedFiles.filter(a => a !== undefined);
        this._treeStructure.clear();
        this.buildHierarchy(fwItems)
            .then(() => {
                    while (this._nextRefreshQueue.length > 0) {
                        const f = this._nextRefreshQueue[0];
                        if (f) {
                            try {
                                const success = f();
                                if (success) {
                                    this._nextRefreshQueue.shift();
                                }
                            } catch (e) {
                                log.error("Error while executing nextRefreshTick", e);
                            }
                        } else {
                            this._nextRefreshQueue.shift();
                        }
                    }
                    this._onDidChangeTreeData.fire();
                },
                (err) => log.error("Error while building hierarchy", err));
    }

    private _nextRefreshQueue: (() => boolean | Promise<boolean>)[] = [];

    public onNextRefresh(action: () => boolean | Promise<boolean>) {
        this._nextRefreshQueue.push(action);
    }

    public commit(): void {
        // const files = this._tree.toList();
        // const renameMap: { oldPath: string, newPath: string }[] = [];
        //
        // files.forEach(f => {
        //     if (!f.isDraggable) return;
        //     if (!f.item.fsName) return;
        //     const oldPath = f.id;
        //     const newPath = f.buildFsPath(1);
        //     if (oldPath !== newPath) {
        //         renameMap.push({oldPath, newPath});
        //     }
        // });
        //
        // if (renameMap.length > 1) {
        //     vscode.window.showInformationMessage(`Renaming ${renameMap.length} files...`,
        //         {modal: true}, 'OK').then(async (result) => {
        //         if (result === 'OK') {
        //             await this._fileManager.batchRenameFiles(renameMap);
        //         }
        //         await this.refresh();
        //     });
        // } else if (renameMap.length === 1) {
        //     this._fileManager.batchRenameFiles(renameMap).then(() => this.refresh());
        // } else {
        //     this.refresh();
        // }

    }

    private _handleActiveTextEditorChanged(e: vscode.TextEditor | undefined) {
        if (!this._ctx.syncEditor || !e) return;
        this.reveal(e.document.uri.fsPath);
    }

    public async reveal(fsPath: string, force = false): Promise<boolean> {
        const element = this._treeStructure.getNode(fsPath);

        if (element) {
            const revealOptions = {
                select: true,
                expand: true,
                focus: false
            };

            if (force) {
                try {
                    await vscode.commands.executeCommand(`${FictionWriter.views.projectExplorer.id}.focus`);
                } catch (err) {
                    log.error("Err", err);
                }
            }

            if (element.visible) {
                await this._treeView.reveal(element as ProjectNode, revealOptions);
            } else {
                await this.filter(AllFilesFilter);
                // revealOptions.focus = true;
                await this._treeView.reveal(element as ProjectNode, revealOptions);
            }

            // TODO: decide if need to highlight
            // if (force) {
            //     setTimeout(() => {
            //         element.item.highlight = true;
            //         this._onDidChangeTreeData.fire(element);
            //         setTimeout(() => {
            //             element.item.highlight = false;
            //             this._onDidChangeTreeData.fire(element);
            //         }, 1000);
            //     }, 100);
            // }
            return true;
        }

        return false;
    }

    public async startCompile(e: ProjectNode) {
        const node = this._treeStructure.getNode(e.id);
        if (node) {
            await this.setCtx({is: action.compiling});
            this._treeStructure.toList().forEach(n => {
                if (Permissions.has(n.data.security?.permissions, FwPermission.Compile)) {
                    n.checked = false;
                } else {
                    n.checked = undefined;
                }
            });
            this._treeView.description = "Compile";

            this._treeStructure.selectChildren(node, true);
            this._onDidChangeTreeData.fire();
        }
    }

    public selectChildren(node: ProjectNode, checked: boolean) {
        this._treeStructure.selectChildren(node, checked);
        this._onDidChangeTreeData.fire();
    }

    public getSelectedNodes(): FwItem[] | undefined {
        if (this.selectedItems.length > 1) {
            return this.selectedItems;
        }
        return [];
    }

    public getCheckedNodes(): string[] {
        const result = this._treeStructure.dfsList(this._treeStructure.root,
                (a, b) => a.data.fwItem!.info!.name > b.data.fwItem!.info!.name ? 1 : -1)
            .filter(n => n.checked === true &&
                n.data.fwItem?.fsRef?.fsExists &&
                Permissions.check(n.data.fwItem?.info, FwPermission.OpenEditor))
            .map(l => l.data.fwItem!.fsRef!.fsPath);

        return result;
    }

    public async discardCompile() {
        await this.setCtx({is: action.none});
        this._treeStructure.toList().forEach(n => {
            n.checked = undefined;
        });
        this._treeView.description = undefined;

        this._onDidChangeTreeData.fire();
    }

    public async setView(view: ProjectView, node?: ProjectNode) {
        await this.setCtx({projectView: view}, true);
        this._setNavigationRoot(node);
        this._onDidChangeTreeData.fire();
    }

    public async filter(filter: string | IFileFilter) {

        if (typeof filter === 'string') {
            switch (filter) {
                case OnlyProjectFilesFilter.key:
                    this._fileFilter = OnlyProjectFilesFilter;
                    break;
                case AllFilesFilter.key:
                    this._fileFilter = AllFilesFilter;
                    break;
            }
        } else {
            this._fileFilter = filter;
        }

        this.setCtx({filter: this._fileFilter.key}, true)
            .then(() => this.refresh());
    }

    // private _updateCheckboxBasedOnMeta(root: ProjectNode) {
    //     // only update children that already have a checkbox
    //     root.checked = root.checked === false
    //         ? this._stateManager.get(root.id)?.metadata?.value?.compile !== 'exclude'
    //         : undefined;
    //     root.children?.forEach(c => this._updateCheckboxBasedOnMeta(c as ProjectNode));
    // }

    private async loadCtx() {
        await ObjectProps.updateAsync(this._ctx, {
            onProperty: (key) => {
                return Promise.resolve(this._contextManager.get(`${FictionWriter.views.projectExplorer.ctx}.${key}`, this._ctx[key]));
            },
        });
        await this.setCtx(this._ctx);
    }

    public async changeContext(value: Partial<IProjectContext>, persist: boolean = false) {
        await this.setCtx(value, persist);
        this.refresh();
    }

    public async goBack() {
        if (this._navigationRoot) {
            this._setNavigationRoot(this._navigationRoot.parent);
            return this._onDidChangeTreeData.fire();
        }
    }

    public async goForward(node: ProjectNode) {
        this._setNavigationRoot(node);
        if (Permissions.check(node.data?.fwItem?.info, FwPermission.OpenEditor)) {
            vscode.commands.executeCommand('vscode.open',
                vscode.Uri.parse(node.data.fwItem!.fsRef!.fsPath));
        }

        return this._onDidChangeTreeData.fire();
    }

    private _setNavigationRoot(node?: TreeNode<IFileState>) {
       if (node?.data?.fwItem?.info?.type === FwType.Folder) {
            this._navigationRoot = node;
        } else {
            this._navigationRoot = node?.parent;
        }

        log.tmp("Navitation root", this._navigationRoot?.id);
        this.setCtx({navigationRoot: this._navigationRoot?.id}, true);


        this._treeView.title =
            !this._navigationRoot || this._navigationRoot === this._treeStructure.root
                ? "Project" : this._navigationRoot?.data?.fwItem?.info?.displayName;
    }


    private async setCtx(value: Partial<IProjectContext>, persist: boolean = false) {

        await ObjectProps.patchAsync(this._ctx, value, {
            onSinglePropertyChange: async (key, value) => {
                if (persist) {
                    await this._contextManager.set(`${FictionWriter.views.projectExplorer.ctx}.${key}`, value);
                }
            }
        });

        let vmChanges = new ProjectViewContextBuilder().build({ctx: this._ctx});

        await ObjectProps.patchAsync(this._viewModel, vmChanges, {
            onSinglePropertyChange: async (key, value) =>
                await vscode.commands.executeCommand('setContext', `${FictionWriter.views.projectExplorer.ctx}.${key}`, value)
        });
    }


}

interface IFileOrderFormat {
    format(order: number): string;
}

class NumberDotFileOrderFormat implements IFileOrderFormat {
    public static regex: RegExp = /^(\d+\.)* (.*)/i;

    constructor(private _pad: number) {
    }

    format(order: number): string {
        return order.toString().padStart(this._pad, '0') + '.';
    }
}