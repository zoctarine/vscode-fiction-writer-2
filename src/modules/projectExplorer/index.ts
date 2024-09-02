import * as vscode from "vscode";
import {Disposable} from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {FwFileManager} from "../../core/fwFileManager";
import {ProjectsOptions} from "./projectsOptions";
import {DisposeManager} from "../../core/disposable";
import {addCommand, FictionWriter} from '../../core';
import {ContextManager} from '../../core/contextManager';
import {ProjectNode} from './projectNodes';
import {ProjectExplorerDecorationProvider} from './projectExplorerDecorationProvider';
import {StateManager} from '../../core/state';

export class ProjectsModule extends DisposeManager {
    active = false;
    options = new ProjectsOptions();
    fileManager!: FwFileManager;
    stateManager!: StateManager;
    contextManager!: ContextManager;
    projectExplorerDataProvider: ProjectExplorerTreeDataProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.projectExplorerDataProvider = new ProjectExplorerTreeDataProvider(
            this.options,
            this.fileManager, this.contextManager, this.stateManager);


        this.manageDisposable(
            this.projectExplorerDataProvider,
            new ProjectExplorerDecorationProvider(this.stateManager),
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
            addCommand(FictionWriter.views.projectExplorer.reorder.redistribute, () => {
                this.projectExplorerDataProvider?.redistribute();
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

    register(fileManager: FwFileManager, contextManager: ContextManager, stateManager: StateManager): vscode.Disposable {
        this.fileManager = fileManager;
        this.contextManager = contextManager;
        this.stateManager = stateManager;

        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return Disposable.from(this.options, this);
    }
}

export const projectsModule = new ProjectsModule();