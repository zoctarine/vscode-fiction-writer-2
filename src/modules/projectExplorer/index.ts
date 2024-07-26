import * as vscode from "vscode";

import {ProjectExplorerTreeDataProvider} from "./projectExplorerTreeDataProvider";
import {FileManager} from "./fileManager";
import {ProjectsOptions} from "./projectsOptions";


export function activate(context: vscode.ExtensionContext) {
    const options = new ProjectsOptions();
    let fileManager: FileManager | undefined;
    let projectExplorerDataProvider: ProjectExplorerTreeDataProvider | undefined;

    context.subscriptions.push(options);

    context.subscriptions.push(options.enabled.onChanged((enabled) => {
        console.log("Projects: " + (enabled ? "enabled" : "disabled"));
        if (enabled) {
            fileManager = new FileManager();
            projectExplorerDataProvider = new ProjectExplorerTreeDataProvider(fileManager);
            context.subscriptions.push(fileManager);
            context.subscriptions.push(projectExplorerDataProvider);
        } else {
            fileManager?.dispose();
            projectExplorerDataProvider?.dispose();
        }
    }));

    options.enabled.emit();
}
