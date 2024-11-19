import * as vscode from 'vscode';
import {InputBoxValidationSeverity, l10n, TreeItemCheckboxState} from 'vscode';
import * as path from 'path';
import {
    DefaultOrderParser,
    DisposeManager,
    FactorySwitch,
    FictionWriter,
    FwEmpty,
    FwEmptyVirtualFolder,
    FwFileManager,

    FwInfo,
    FwPermission,
    FwProjectFileItem,
    FwRootItem,
    FwSubType,
    FwVirtualFolderItem, IFwInfo,
    log, notifier,
    Permissions,
    TreeStructure
} from "../../core";
import {ContextManager} from '../../core/contextManager';
import {ProjectExplorerTreeItem} from './models/projectExplorerTreeItem';
import {ProjectsOptions} from './projectsOptions';
import {IDecorationState, IFileState, StateManager} from '../../core/state';
import {AllFilesFilter, IFileFilter, OnlyProjectFilesFilter} from './models/filters';
import {FaIcons} from '../../core/decorations';
import rfdc from 'rfdc';
import {ProjectNode, ProjectNodeList} from './models/projectNode';
import {ObjectProps} from '../../core/lib';
import {IProjectContext} from './models/IProjectContext';
import {IProjectTreeViewModel} from './models/IProjectTreeViewModel';
import {ProjectNodeContextBuilder} from './models/IProjectNodeContext';
import {Context} from '../../core/lib/context';
import {retry} from '../../core/lib/retry';
import {fwPath} from '../../core/FwPath';
import {FwItem} from '../../core/fwFiles/FwItem';
import {FsPathParser} from '../../core/fwFiles/parsers/fileName/FwFileNameParser';


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
    private _fileFilter: IFileFilter = OnlyProjectFilesFilter;
    private _ctx: IProjectContext = {
        decoration: 'decoration1',
        filter: 'projectFiles',
        is: undefined,
        multiselect: undefined,
        syncEditor: false
    };
    public selectedItems: FwItem[] = [];


    private _viewModel: IProjectTreeViewModel = {
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
        sync: ''
    };

    constructor(
        private _options: ProjectsOptions,
        private _fileManager: FwFileManager, private _contextManager: ContextManager, private _stateManager: StateManager) {
        super();
        this._treeStructure = new TreeStructure<IFileState>(new ProjectNode('root', {fwItem: new FwItem(new FwRootItem())}));
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
                log.tmp("fileDescriptionMetadataKey", v)
                return this.refresh();
            }),
            this._stateManager.onFilesStateChanged(() => {
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
            .then(() => this._fileFilter = this._ctx.filter === 'projectFiles' ? OnlyProjectFilesFilter : AllFilesFilter)
            .then(() => this.refresh());
    }

    private async buildVirtualFolders(node: ProjectNode) {
        if (!node) return;

        // if (node.children && node.children.length > 0) {
        //     const possibleParents = new Map<number, ProjectNode>(node.children
        //         .filter(n =>
        //             n.data.fwItem?.info?.order.length &&
        //             n.data.fwItem.info.order.length > 0 &&
        //             n.data.fwItem.info.subType !== FwSubType.Folder)
        //         .map(c => [c.data.fwItem?.info?.order[0]!, c]));
        //
        //     const possibleChildren = node.children
        //         .filter(n =>
        //             n.data.fwItem?.info?.order.length &&
        //             n.data.fwItem.info.order.length > 1 &&
        //             n.data.fwItem.info.subType !== FwSubType.Folder);
        //
        //     for (const child of possibleChildren) {
        //         if (!child.data.fwItem?.info) continue;
        //         const parentOrders = child.data.fwItem.info?.order.slice(1) ?? [];
        //         const order = parentOrders.pop();
        //         if (order && order > 0 && child.parent) {
        //             let parent = possibleParents.get(order);
        //             if (!parent) {
        //                 parent = new ProjectNode(child.parent.id + "/" + order, {fwItem: new FwInfo(FwEmptyVirtualFolder.create(child.parent.data?.fwItem?.ref, order))});
        //                 this._treeStructure.addChild(parent, child.parent);
        //                 possibleParents.set(order, parent);
        //             }
        //
        //             // TODO(TEST)
        //             if (child.data.fwItem!.ref.name.otherOrders) {
        //                 child.data.fwItem!.ref.name.otherOrders.splice(0, 1);
        //             }
        //             this._treeStructure.detach(child);
        //             this._treeStructure.addChild(child, parent);
        //
        //             if (parent.data.fwItem) {
        //                 this._morph(parent, parent.data.fwItem.ref.fsExists
        //                     ? FwVirtualFolderItem
        //                     : FwEmptyVirtualFolder);
        //             }
        //         }
        //     }
        //
        //     for (let child of node.children) {
        //         await this.buildVirtualFolders(child);
        //
        //         // Hide empty virtual folders that don't have any
        //         // visible items.
        //         if (child.data.fwItem?.ref?.subType === FwSubType.EmptyVirtualFolder &&
        //             child.children && child.children.every(c => !c.visible)) {
        //             child.visible = false;
        //         }
        //     }
        // }
    }

    private async _morph(node: ProjectNode, ctor: { new(fwFile: IFwInfo): IFwInfo }) {
        const ref = node.data.fwItem?.info;
        if (!ref) return;

        const instance = new ctor(ref);
        ref.type = instance.type;
        ref.control = instance.control;
        ref.subType = instance.subType;
        Object.setPrototypeOf(ref, Object.getPrototypeOf(instance));

        if (!node.data.decorations) {
            node.data.decorations = {};
        }

        // TODO: refactor this
        const newstate = clone(node.data);
        await this._stateManager.processUnmanaged(newstate);
        node.data.decorations = newstate.decorations;
    }

    private arrangeWorkspaces() {
        const workspaces: ProjectNode[] = [];
        const collectWorkspaces = (node: ProjectNode, workspaces: ProjectNode[]) => {
            if (node.data.fwItem?.info?.subType === FwSubType.WorkspaceFolder) {
                workspaces.push(node);
            } else if (node.children?.length > 0) {
                for (const child of node.children) {
                    collectWorkspaces(child, workspaces);
                }
            }

        };

        const root = this._treeStructure.root;
        collectWorkspaces(root, workspaces);

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
            this.printTree(child, indent + "  ");
        }
    }

    private async buildHierarchy(states: IFileState[]) {
        const tree = new TreeStructure<IFileState>(new ProjectNode('root', {fwItem: new FwItem(new FwRootItem())}));
        const workspaces: ProjectNode[] = [];
        for (const state of states) {
            if (!state?.fwItem?.fsRef) continue;
            const {fsPath} = state.fwItem.fsRef;
            const segments = fsPath.split(path.posix.sep);
            let currentLevel = tree.root;
            let currentPath = '/';
            for (const segment of segments) {
                currentPath = path.posix.join(currentPath, segment);

                let node = tree.getNode(currentPath);
                if (!node) {
                    node = new ProjectNode(
                        currentPath,
                        {
                            fwItem: new FwItem(new FwEmpty()),
                            decorations: {
                                icon: FaIcons.inbox
                            }
                        });
                    tree.addChild(node, currentLevel);
                }
                currentLevel = node;
            }

            currentLevel.data = state;
            currentLevel.visible = this._fileFilter.check(state.fwItem?.info);
            if (currentLevel.data.fwItem?.info?.subType === FwSubType.WorkspaceFolder) {
                workspaces.push(currentLevel);
            }
        }

        this._treeStructure = tree;

        // TODO: optimize workspace folder filtering) and virtual folder building
        //       should be more efficient for larger implementation. (current draft)
        this.arrangeWorkspaces();
        await this.buildVirtualFolders(tree.root);
    }

    public getParent(element: ProjectNode): ProjectNode | undefined {
        return element.parent;
    }

    public getChildren(element: ProjectNode): ProjectNode[] {

        const children = (element
                ? this._treeStructure.getNode(element.id)?.children
                : this._treeStructure.getRoot().children)
            ?? [];

        return new ProjectNodeList(children)
            .filter()
            .sort()
            .items;
    }


    public getTreeItem(element: ProjectNode): vscode.TreeItem {
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

        const item = new ProjectExplorerTreeItem(node, {
            expanded: this._contextManager.get("tree_expanded_" + element.id, false),
            contextBuilder: () => ({}),
            decorationsSelector: (s) =>
                new FactorySwitch<(IDecorationState | undefined)[]>()
                    .case(this._ctx.decoration === 'decoration1', () => [s.writeTargetsDecorations, s.metadataDecorations, overwrittenMetaDecoration, additionalDecoration])
                    .case(this._ctx.decoration === 'decoration2', () => [s.metadataDecorations, overwrittenMetaDecoration, additionalDecoration])
                    .case(this._ctx.decoration === 'decoration3', () => [s.textStatisticsDecorations, s.writeTargetsDecorations, additionalDecoration])
                    .case(this._ctx.decoration === 'decoration4', () => [additionalDecoration])
                    .create()
        });

        item.contextValue = Context.serialize(
            new ProjectNodeContextBuilder().build({node, ctx: this._ctx}));

        return item;
    }

    public async toggleVirtualFolder(node: ProjectNode): Promise<void> {
        if (node.data.fwItem?.info?.subType === FwSubType.ProjectFile) {
            await this._morph(node, FwVirtualFolderItem);
            this._onDidChangeTreeData.fire();
        } else if (node.data.fwItem?.info?.subType === FwSubType.VirtualFolder) {
            if (node.children?.length === 0) {
                await this._morph(node, FwProjectFileItem);
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

    public async addFolder(node: ProjectNode) {
        node = node ?? this._treeView.selection[0];
        // TODO: get parent folder if this is not folder...
        const ref = node.data.fwItem?.fsRef;
        if (!ref) return;
        const makeFinalPath = (value: string) => fwPath.join(ref.fsPath, value);
        const baseName = 'Chapter';
        // TODO: get proper folder name, maybe based on ordering,1-2-3... SimpleSuffixOrderParser
        let folderName = retry<string>((cnt) => {
            if (!fwPath.exists(makeFinalPath('Chapter' + (cnt + 1)))) {
                return baseName + (cnt + 1);
            }
        }) ?? baseName;
        if (Permissions.check( node.data.fwItem?.info, FwPermission.AddChildren)) {
            // TODO: add retry?
            const value = await vscode.window.showInputBox({
                title: `Add folder`,
                prompt: `Folder name:`,
                valueSelection: [0, folderName.length],
                value: folderName,
                validateInput: async (value: string) => {
                    if (!value || value === '') {
                        return {
                            message: "Value must be a valid name",
                            severity: InputBoxValidationSeverity.Error
                        };
                    }

                    if (fwPath.exists(makeFinalPath(value))) {
                        return {
                            message: "The folder name already exists",
                            severity: InputBoxValidationSeverity.Error
                        };
                    }
                }
            });
            if (value) {
                const fsPath = path.posix.join(ref.fsPath, value);
                const created = await this._fileManager.createFolder(fsPath);
                if (!created) {
                    notifier.warn(`Could not create folder: ${value}`);
                }
            }
        }
    }

    public async rename({data: {fwItem}}: ProjectNode) {
        // if (fwItem) {
        //     const {info} = fwItem;
        //     const startIndex = ref.name.orderPart?.length ?? 0;
        //     let endIndex = (startIndex > 0 ? startIndex - 1 : startIndex) + (ref.name.namePart?.length ?? 0);
        //     const getFwChanges = async (value: string) => {
        //         const parser = new FwFileNameParser(new DefaultOrderParser());
        //         let newFile = await parser.parse(value);
        //         const messages = [];
        //         if (newFile.name.orderPart !== ref.name.orderPart) {
        //             messages.push("the file order segment");
        //         }
        //         if (newFile.fsExt !== ref.fsExt) {
        //             messages.push(`the file type`);
        //         } else if (newFile.ext !== ref.ext) {
        //             messages.push(`the FictionWriter extended extension`);
        //         }
        //
        //         return messages;
        //     };
        //
        //     const value = await vscode.window.showInputBox({
        //         title: `Rename ${ref.name}`,
        //         prompt: `New file name:`,
        //         valueSelection: [startIndex, endIndex],
        //         value: ref.fsName,
        //         validateInput: async (value: string) => {
        //
        //             if (!value || value === '') {
        //                 return {
        //                     message: "Value must be a valid filename",
        //                     severity: InputBoxValidationSeverity.Error
        //                 };
        //             }
        //             const messages = await getFwChanges(value);
        //
        //             if (messages.length > 0) {
        //                 let last = messages.pop();
        //                 if (messages.length > 0) last = ` and ${last}`;
        //                 return {
        //                     message: `Warning: You changed ${messages.join(', ')}${last}`,
        //                     severity: InputBoxValidationSeverity.Warning
        //                 };
        //             }
        //         }
        //     });
        //     if (value) {
        //         let doRename = true;
        //         if ((await getFwChanges(value)).length > 0) {
        //             doRename = await vscode.window.showWarningMessage("Are you sure?",
        //                 {
        //                     modal: true,
        //                     detail: `Renaming\n\n'${ref.fsName}'\n\nto:\n\n ${value}\n\n may result in FictionWriter handling the file differently.\n\nJust make sure you are OK with this change.`,
        //                 },
        //                 "OK") === 'OK';
        //         }
        //         if (doRename) {
        //             await this._fileManager.renameFile(
        //                 ref.fsPath,
        //                 path.posix.join(ref.fsDir, value)).then(() => {
        //             }).catch(err => log.warn(err));
        //         }
        //     }
        // }
    }

    public delete(node: ProjectNode): void {
        // node = node ?? this._treeView.selection[0];
        //
        // if (node) {
        //     this._fileManager.deleteFile(node.id);
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
        //         } else {
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
        const decorations = ['decoration1', 'decoration2', 'decoration3', 'decoration4'];
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
        const fwItems = this._stateManager.trackedFiles.filter(a => a !== undefined);
        this._treeStructure.clear();
        this.buildHierarchy(fwItems)
            .then(() => this._onDidChangeTreeData.fire(),
                (err) => log.error("Error while building hierarchy", err));
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

    public async reveal(fsPath: string, force = false) {
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
                await this._treeView.reveal(element, revealOptions);
            } else {
                await this.filter(AllFilesFilter);
                // revealOptions.focus = true;
                await this._treeView.reveal(element, revealOptions);
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
        }
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

    public retrieveSelection(): string[] {
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

    private async setCtx(value: Partial<IProjectContext>, persist: boolean = false) {

        await ObjectProps.patchAsync(this._ctx, value, {
            onSinglePropertyChange: async (key, value) => {
                if (persist) {
                    await this._contextManager.set(`${FictionWriter.views.projectExplorer.ctx}.${key}`, value);
                }
            }
        });

        let vmChanges: Partial<IProjectTreeViewModel> = {};
        switch (this._ctx.is) {
            case "ordering":
                vmChanges = {
                    decoration: undefined,
                    filter: undefined,
                    compileStart: undefined,
                    compileCommit: undefined,
                    compileDiscard: undefined,
                    newFile: undefined,
                    newFolder: undefined,
                    orderStart: undefined,
                    orderCommit: true,
                    orderDiscard: true,
                    refresh: undefined,
                    sync: undefined
                };
                break;
            case "compiling":
                vmChanges = {
                    decoration: undefined,
                    filter: undefined,
                    compileStart: undefined,
                    compileCommit: true,
                    compileDiscard: true,
                    newFile: undefined,
                    newFolder: undefined,
                    orderStart: undefined,
                    orderCommit: undefined,
                    orderDiscard: undefined,
                    refresh: undefined,
                    sync: undefined
                };
                break;
            default :
                vmChanges = {
                    decoration: this._ctx.decoration,
                    filter: this._ctx.filter,
                    compileStart: true,
                    compileCommit: undefined,
                    compileDiscard: undefined,
                    newFile: true,
                    newFolder: true,
                    orderStart: true,
                    orderCommit: undefined,
                    orderDiscard: undefined,
                    refresh: true,
                    sync: this._ctx.syncEditor ? 'on' : 'off'
                };
                break;
        }
        await ObjectProps.patchAsync(this._viewModel, vmChanges, {
            onSinglePropertyChange: async (key, value) => await vscode.commands.executeCommand('setContext', `${FictionWriter.views.projectExplorer.ctx}.${key}`, value)
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