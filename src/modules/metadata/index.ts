import * as vscode from "vscode";
import {addCommand, DisposeManager, FileManager} from '../../core';
import {StateManager} from '../../core/stateManager';
import {fileManager} from '../../core';
import {MetadataTreeDataProvider} from './metadataTreeDataProvider';
import {MetadataOptions} from './metadataOptions';
import {ExtensionContext} from 'vscode';
import {MetadataTreeDecorationProvider} from './metadataDecoration';
import {ProjectCache} from './cache';
import {FwFileManager} from '../../core/fwFileManager';

export * from './cache';

class MetadataModule extends DisposeManager {
    active = false;
    stateManager: StateManager | undefined;
    private fileManager: FwFileManager | undefined;
    private context: ExtensionContext | undefined;
    private options = new MetadataOptions();
    private metadataTreeDataProvider: MetadataTreeDataProvider | undefined;
    private metadataDecorationProvider: MetadataTreeDecorationProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.metadataTreeDataProvider = new MetadataTreeDataProvider(this.options);
        this.metadataDecorationProvider = new MetadataTreeDecorationProvider();
        this.manageDisposable(
            this.metadataTreeDataProvider,
            this.metadataTreeDataProvider.onDidChangeTreeData(() => {
                this.metadataDecorationProvider?.file();
            })
        );
    };

    deactivate(): void {
        this.dispose();
        this.metadataTreeDataProvider = undefined;
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(context: ExtensionContext, stateManager: StateManager, fileManager: FwFileManager | undefined): vscode.Disposable {
        this.fileManager = fileManager;
        this.stateManager = stateManager;
        this.context = context;

        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return vscode.Disposable.from(this.options, this);
    }
}

export const metadataModule = new MetadataModule();