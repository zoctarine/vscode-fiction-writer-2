import * as vscode from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {FileManager} from "./fileManager";
import {ProjectsOptions} from "./projectsOptions";
import {Disposable} from "vscode";
import {DisposeManager} from "../../core/disposable";
import * as logger from "../../core/logger";

const log = logger.makeLog("[ProjectsModule]", "red");
class ProjectsModule extends DisposeManager {
    active = false;
    options = new ProjectsOptions();
    fileManager: FileManager | undefined;
    projectExplorerDataProvider: ProjectExplorerTreeDataProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        log.debug("activate");
        this.fileManager = new FileManager();
        this.projectExplorerDataProvider = new ProjectExplorerTreeDataProvider(this.fileManager);

        this.manageDisposable(
            this.fileManager,
            this.projectExplorerDataProvider);
    };

    deactivate(): void {
        log.debug("deactivate");

        this.disposeAndForget(this.projectExplorerDataProvider);
        this.projectExplorerDataProvider = undefined;

        this.disposeAndForget(this.fileManager);
        this.fileManager = undefined;
    };

    private updateState(enabled: boolean){
        console.log("[ProjectsModule.updateState]", `options.enabled: ${enabled}`);
        if (enabled ) {
            this.activate();
        } else if (!enabled ) {
            this.deactivate();
        }
    }
    register(): vscode.Disposable {

        this.options.enabled.onChanged((enabled) => {
            console.log("[options.enabled.onChanged]",`to: ${enabled}`);
           this.updateState(enabled);
        });

        this.manageDisposable(
            this.options);

        this.options.enabled.emit();

        return Disposable.from(this);
    }
}

export const projectsModule = new ProjectsModule();