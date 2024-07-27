import * as vscode from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {FileManager} from "./fileManager";
import {ProjectsOptions} from "./projectsOptions";
import {Disposable} from "vscode";
import {DisposeManager} from "../../core/disposable";

class ProjectsModule extends DisposeManager {
    active = false;
    options = new ProjectsOptions();
    fileManager: FileManager | undefined;
    projectExplorerDataProvider: ProjectExplorerTreeDataProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.fileManager = new FileManager();
        this.projectExplorerDataProvider = new ProjectExplorerTreeDataProvider(this.fileManager);

        this.manageDisposable(
            this.fileManager,
            this.projectExplorerDataProvider);
        this.active = true;
    };

    deactivate(): void {
        this.disposeAndForget(this.projectExplorerDataProvider);
        this.projectExplorerDataProvider = undefined;

        this.disposeAndForget(this.fileManager);
        this.fileManager = undefined;

        this.active = false;
    };

    register(): vscode.Disposable {

        this.manageDisposable(
            this.options,
            this.options.enabled.onChanged((enabled) => {
                if (enabled && !this.active) {
                    this.activate();
                } else if (!enabled && this.active) {
                    this.deactivate();
                }
            }));

        // Set the initial state
        this.options.enabled.emit();

        return Disposable.from(this);
    }
}

export const projectsModule = new ProjectsModule();