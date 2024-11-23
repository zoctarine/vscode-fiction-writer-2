import * as vscode from "vscode";
import {Disposable} from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {ProjectsOptions} from "./projectsOptions";
import {ArrayTools, DisposeManager} from "../../core";
import {addCommand, CoreModule, FictionWriter, log} from '../../core';
import {ProjectExplorerDecorationProvider} from './projectExplorerDecorationProvider';
import {ProjectNode} from './models/projectNode';
import {DeleteNode} from './commands/DeleteNode';
import {RenameNode} from './commands/RenameNode';
import {AddToProject} from './commands/AddToProject';
import {ExcludeFromProject} from './commands/ExcludeFromProject';
import {CombineFiles} from './commands/CombineFiles';
import {RevealInExplorer} from './commands/RevealInExplorer';
import {AddChildFolder} from './commands/AddChildFolder';

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
            addCommand(FictionWriter.views.projectExplorer.newFolder, async (node: ProjectNode) => {
                const newName = await new AddChildFolder(this.core.fileManager).runAsync(node.data?.fwItem);
                if (newName) {
                    this.projectExplorerDataProvider?.onNextRefresh(() => {
                        this.projectExplorerDataProvider?.reveal(newName, false);
                    });
                }
            }),
            addCommand(FictionWriter.views.projectExplorer.rename, async (node: ProjectNode) => {
                const newName = await new RenameNode(this.core.fileManager, this.core.fwItemBuilder).runAsync(node);
                if (newName) {
                    this.projectExplorerDataProvider?.onNextRefresh(() => {
                        this.projectExplorerDataProvider?.reveal(newName, true);
                    });
                }
            }),
            addCommand(FictionWriter.views.projectExplorer.trash, async (node: ProjectNode) => {
                return new DeleteNode(this.core.fileManager).runAsync(node);
            }),
            addCommand(FictionWriter.views.projectExplorer.toggleVirtualFolder, (node: ProjectNode) => {
                this.projectExplorerDataProvider?.toggleVirtualFolder(node);
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

            addCommand(FictionWriter.explorer.revealInProjectsView, (uri: vscode.Uri) =>
                this.projectExplorerDataProvider?.reveal(uri.fsPath, true)),

            addCommand(FictionWriter.views.projectExplorer.revealInExplorer, (node: ProjectNode) =>
                new RevealInExplorer().runAsync(node?.data.fwItem)),

            addCommand(FictionWriter.views.projectExplorer.addToProject, (node: ProjectNode) =>
                new AddToProject(this.core.fileManager).runAsync(
                    ArrayTools.firstNotEmpty(
                        this.projectExplorerDataProvider?.getSelectedNodes(),
                        [node?.data?.fwItem])
                )
            ),

            addCommand(FictionWriter.views.projectExplorer.excludeFromProject, (node: ProjectNode) =>
                new ExcludeFromProject(this.core.fileManager).runAsync(
                    ArrayTools.firstNotEmpty(
                        this.projectExplorerDataProvider?.getSelectedNodes(),
                        [node?.data?.fwItem])
                )),

            addCommand(FictionWriter.files.combine, (node: ProjectNode) =>
                new CombineFiles(this.core.fileManager).runAsync(
                    ArrayTools.firstNotEmpty(
                        this.projectExplorerDataProvider?.getSelectedNodes(),
                        [node?.data?.fwItem])
                )),

            addCommand(FictionWriter.views.projectExplorer.debug.stateDump, (node: ProjectNode) => {
                log.debug("ProjectExplorer", {
                    node,
                    state: this.core.stateManager.get(node.id)
                });
            })
        )
        ;
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