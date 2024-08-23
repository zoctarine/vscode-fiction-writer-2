import * as vscode from "vscode";
import {Disposable} from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {FwFileManager} from "../../core/fwFileManager";
import {ProjectsOptions} from "./projectsOptions";
import {DisposeManager} from "../../core/disposable";
import * as logger from "../../core/logger";
import {addCommand, FictionWriter} from '../../core';
import {NodeType} from './nodeType';
import {Node} from '../../core/tree/node';
import {StateManager} from '../../core/stateManager';
import {ProjectNode} from './projectNodes';
import {ProjectCache} from '../metadata';

class ProjectsModule extends DisposeManager {
    active = false;
    options = new ProjectsOptions();
    fileManager: FwFileManager | undefined;
    projectCache: ProjectCache |undefined;
    stateManger!: StateManager;
    projectExplorerDataProvider: ProjectExplorerTreeDataProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.fileManager = new FwFileManager(this.options);
        this.projectCache = new ProjectCache(this.fileManager);
        this.projectExplorerDataProvider = new ProjectExplorerTreeDataProvider(
            this.options,
            this.fileManager, this.stateManger, this.projectCache);

        this.manageDisposable(
            this.fileManager,
            this.projectCache,
            this.projectExplorerDataProvider,
            addCommand(FictionWriter.views.projectExplorer.sync.on, () => {
                this.projectExplorerDataProvider?.syncWithActiveEditorOn();
            }),
            addCommand(FictionWriter.views.projectExplorer.sync.off, () => {
                this.projectExplorerDataProvider?.syncWithActiveEditorOff();
            }),
            addCommand(FictionWriter.views.projectExplorer.newFile, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.addFile(node);
            }),
            addCommand(FictionWriter.views.projectExplorer.newFolder, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.addFolder(node);
            }),
            addCommand(FictionWriter.views.projectExplorer.rename, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.rename(node);
            }),
            addCommand(FictionWriter.views.projectExplorer.trash, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.delete(node);
            }),
            addCommand(FictionWriter.views.projectExplorer.makeVirtualFolder, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.makeVirtualFolder(node);
            }),
            addCommand(FictionWriter.views.projectExplorer.breakVirtualFolder, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.makeVirtualFolder(node);
            }),
            addCommand(FictionWriter.views.projectExplorer.reorder, () => {
                this.projectExplorerDataProvider?.enableOrdering();
            }),
            addCommand(FictionWriter.views.projectExplorer.discard, () => {
                this.projectExplorerDataProvider?.disableOrdering();
            }),
            addCommand(FictionWriter.views.projectExplorer.commit, () => {
               this.projectExplorerDataProvider?.commitOrdering();
            }));
    };

    deactivate(): void {
        this.dispose();
        this.projectExplorerDataProvider = undefined;
        this.fileManager = undefined;
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(stateManager: StateManager): vscode.Disposable {

        this.stateManger = stateManager;
        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return Disposable.from(this.options, this);
    }
}

export const projectsModule = new ProjectsModule();