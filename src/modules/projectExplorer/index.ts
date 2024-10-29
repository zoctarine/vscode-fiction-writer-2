import * as vscode from "vscode";
import {Disposable} from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {FwFileManager} from "../../core/fwFiles/fwFileManager";
import {ProjectsOptions} from "./projectsOptions";
import {DisposeManager} from "../../core/disposable";
import {addCommand, CoreModule, FictionWriter, log} from '../../core';
import {ContextManager} from '../../core/contextManager';
import {ProjectNode} from './projectNodes';
import {ProjectExplorerDecorationProvider} from './projectExplorerDecorationProvider';
import {StateManager} from '../../core/state';
import * as commands from './commands';

export class ProjectsModule extends DisposeManager {
    active = false;
    options!: ProjectsOptions;
    core!: CoreModule;
    projectExplorerDataProvider: ProjectExplorerTreeDataProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.projectExplorerDataProvider = new ProjectExplorerTreeDataProvider(
            this.options,
            this.core.fileManager, this.core.contextManager, this.core.stateManager);


        this.manageDisposable(
            this.projectExplorerDataProvider,
            new ProjectExplorerDecorationProvider(this.core.stateManager),
            addCommand(FictionWriter.views.projectExplorer.show.decoration1, () => {
                this.projectExplorerDataProvider?.showNextFor('decoration1');
            }),
            addCommand(FictionWriter.views.projectExplorer.show.decoration2, () => {
                this.projectExplorerDataProvider?.showNextFor('decoration2');
            }),
            addCommand(FictionWriter.views.projectExplorer.show.decoration3, () => {
                this.projectExplorerDataProvider?.showNextFor('decoration3');
            }),
            addCommand(FictionWriter.views.projectExplorer.show.decoration4, () => {
                this.projectExplorerDataProvider?.showNextFor('decoration4');
            }),
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
            addCommand(FictionWriter.views.projectExplorer.reorder.start, () => {
                this.projectExplorerDataProvider?.enableOrdering();
            }),
            addCommand(FictionWriter.views.projectExplorer.reorder.discard, () => {
                this.projectExplorerDataProvider?.disableOrdering();
            }),
            addCommand(FictionWriter.views.projectExplorer.reorder.commit, () => {
                this.projectExplorerDataProvider?.commitOrdering();
            }),
            addCommand(FictionWriter.views.projectExplorer.reorder.redistribute, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.redistribute(node);
            }),

            addCommand(FictionWriter.views.projectExplorer.filters.allFiles, () => {
                this.projectExplorerDataProvider?.filter("allFiles");
            }),

            addCommand(FictionWriter.views.projectExplorer.filters.projectFiles, () => {
                this.projectExplorerDataProvider?.filter("projectFiles");
            }),

            addCommand(FictionWriter.explorer.revealInProjectsView, (uri: vscode.Uri) => {
                return this.projectExplorerDataProvider?.reveal(uri.fsPath, true);
            }),

            addCommand(FictionWriter.views.projectExplorer.revealInExplorer, (node: ProjectNode) => {
                return commands.revealInExplorer(node);
            }),

            addCommand(FictionWriter.views.projectExplorer.addToProject, (node: ProjectNode) => {
                const state = this.core.stateManager.get(node.id);
                return commands.addToProject(state?.fwItem);
            }),

            addCommand(FictionWriter.views.projectExplorer.excludeFromProject, (node: ProjectNode) => {
                const state = this.core.stateManager.get(node.id);
                return commands.excludeFromProject(state?.fwItem);
            }),

            addCommand(FictionWriter.views.projectExplorer.debug.stateDump, (node: ProjectNode) => {
                log.debug("ProjectExplorer", {
                    node,
                    state:this.core.stateManager.get(node.id)
                });
            })
        );
    };

    deactivate(): void {
        this.dispose();
        this.projectExplorerDataProvider = undefined;
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(core: CoreModule): vscode.Disposable {
        this.core = core;
        this.options = core.projectsOptions;

        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return Disposable.from(this);
    }
}

export const projectsModule = new ProjectsModule();