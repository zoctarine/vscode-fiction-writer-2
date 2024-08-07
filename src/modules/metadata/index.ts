import * as vscode from "vscode";
import {addCommand, DisposeManager, FileManager} from '../../core';
import {StateManager} from '../../core/stateManager';
import {fileManager}  from '../../core';
import {MetadataTreeDataProvider} from './metadataTreeDataProvider';

class MetadataModule extends DisposeManager {
    active = false;
    stateManager: StateManager | undefined;
    private fileManager: FileManager | undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.manageDisposable(
            vscode.window.createTreeView('fictionWriter.views.metadata', {
                treeDataProvider: new MetadataTreeDataProvider(this.fileManager)
            })
        );
    };

    deactivate(): void {
        this.dispose();
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(stateManager: StateManager, fileManager: FileManager): vscode.Disposable {
        this.fileManager = fileManager;
        this.stateManager = stateManager;
        this.updateState(true);

        return vscode.Disposable.from(this);
    }
}

export const metadataModule = new MetadataModule();