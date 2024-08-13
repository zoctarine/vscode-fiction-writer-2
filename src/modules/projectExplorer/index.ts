import * as vscode from "vscode";
import {Disposable} from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {FwFileManager} from "../../core/fwFileManager";
import {ProjectsOptions} from "./projectsOptions";
import {DisposeManager} from "../../core/disposable";
import * as logger from "../../core/logger";
import {addCommand} from '../../core';
import {NodeType} from './nodeType';
import {Node} from '../../core/tree/node';
import {StateManager} from '../../core/stateManager';
import {ProjectNode} from './projectNodes';

const log = logger.makeLog("[ProjectsModule]", "red");

class ProjectsModule extends DisposeManager {
    active = false;
    options = new ProjectsOptions();
    fileManager: FwFileManager | undefined;
    stateManger!: StateManager;
    projectExplorerDataProvider: ProjectExplorerTreeDataProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        log.debug("activate");
        this.fileManager = new FwFileManager(this.options);
        this.projectExplorerDataProvider = new ProjectExplorerTreeDataProvider(this.fileManager, this.stateManger);

        this.manageDisposable(
            this.fileManager,
            this.projectExplorerDataProvider,
            addCommand('views.projectExplorer.newFile', (node: ProjectNode) => {
                this.projectExplorerDataProvider?.addFile(node);
            }),
            addCommand('views.projectExplorer.newFolder', (node: ProjectNode) => {
                this.projectExplorerDataProvider?.addFolder(node);
            }),
            addCommand('views.projectExplorer.rename', (node: ProjectNode) => {
                this.projectExplorerDataProvider?.rename(node);
            }),
            addCommand('views.projectExplorer.trash', (node: ProjectNode) => {
                this.projectExplorerDataProvider?.delete(node);
            }),
            addCommand('views.projectExplorer.makeVirtualFolder', (node: ProjectNode) => {
                this.projectExplorerDataProvider?.makeVirtualFolder(node);
            }),
            addCommand('views.projectExplorer.breakVirtualFolder', (node: ProjectNode) => {
                this.projectExplorerDataProvider?.makeVirtualFolder(node);
            }),
            addCommand('views.projectExplorer.reload', () => {
                this.projectExplorerDataProvider?.reload();
            }),
            addCommand('views.projectExplorer.commit', () => {
                this.projectExplorerDataProvider?.reorderAll();
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
            console.log("[options.enabled.onChanged]", `to: ${enabled}`);
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return Disposable.from(this.options, this);
    }
}

export const projectsModule = new ProjectsModule();