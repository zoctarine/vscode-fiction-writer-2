import * as vscode from "vscode";
import {addCommand, DisposeManager, FileManager, mapExtensions} from '../../core';
import {StateManager} from '../../core/stateManager';
import {fileManager} from '../../core';
import {MetadataTreeDataProvider} from './metadataTreeDataProvider';
import {MetadataOptions} from './metadataOptions';
import {ExtensionContext} from 'vscode';
import {MetadataTreeDecorationProvider} from './metadataDecoration';
import {ProjectCache} from './cache';
import {FwFileManager} from '../../core/fwFileManager';
import {ColorResolver, IconResolver} from './iconsAndColors';

export * from './cache';
export * from './iconsAndColors';

class MetadataModule extends DisposeManager {
    active = false;
    stateManager: StateManager | undefined;
    private fileManager: FwFileManager | undefined;
    private context: ExtensionContext | undefined;
    private options = new MetadataOptions();
    metadataTreeDataProvider: MetadataTreeDataProvider | undefined;
    private metadataDecorationProvider: MetadataTreeDecorationProvider | undefined;
    resolvers = {
        iconResolver: new IconResolver(),
        colorResolver: new ColorResolver(),
    };

    constructor() {
        super();
    }

    activate(): void {
        this.metadataTreeDataProvider = new MetadataTreeDataProvider(this.options, this.resolvers);
        this.metadataDecorationProvider = new MetadataTreeDecorationProvider(this.resolvers);
        this.resolvers.iconResolver.setCustom(mapExtensions.objectToMap(this.options.metadataIcons.value));
        this.resolvers.colorResolver.setCustom(mapExtensions.objectToMap(this.options.metadataColors.value));

        this.manageDisposable(
            this.metadataTreeDataProvider,
            this.metadataTreeDataProvider.onDidChangeTreeData(() => {
                this.metadataDecorationProvider?.file();
            }),
            this.options.metadataColors.onChanged((customColors) => {
                this.resolvers.colorResolver.setCustom(mapExtensions.objectToMap(customColors));
            }),
            this.options.metadataIcons.onChanged((customIcons) => {
                this.resolvers.iconResolver.setCustom(mapExtensions.objectToMap(customIcons));
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