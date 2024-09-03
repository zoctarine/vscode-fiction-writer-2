import * as vscode from "vscode";
import {addCommand, DisposeManager, FictionWriter, mapExtensions} from '../../core';
import {ContextManager} from '../../core/contextManager';
import {MetadataTreeDataProvider} from './metadataTreeDataProvider';
import {MetadataOptions} from './metadataOptions';
import {ConfigurationTarget, ExtensionContext} from 'vscode';
import {MetadataTreeDecorationProvider} from './metadataDecoration';
import {ColorResolver, IconResolver} from './iconsAndColors';
import {StateManager} from '../../core/state';

export * from './iconsAndColors';

class MetadataModule extends DisposeManager {
    active = false;
    contextManager: ContextManager | undefined;
    private stateManager!: StateManager;
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
        this.resolvers.iconResolver.setCustom(mapExtensions.objectToMap(this.options.metadataIcons.value));
        this.resolvers.colorResolver.setCustom(mapExtensions.objectToMap(this.options.metadataColors.value));

        this.metadataTreeDataProvider = new MetadataTreeDataProvider(this.options, this.stateManager, this.resolvers);
        this.metadataDecorationProvider = new MetadataTreeDecorationProvider(this.resolvers);

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
            }),

            addCommand(FictionWriter.views.metadata.editSingle, (item)=>{
              return  this.metadataTreeDataProvider?.editMetadata(item);
            }),
            addCommand(FictionWriter.views.metadata.filters.setFileDescriptionMetadataKey, (item) => {
                if (item?.id) {
                    return vscode.workspace.getConfiguration('fictionWriter.projects')
                        .update('fileDescriptionMetadataKey', item.id,
                            ConfigurationTarget.Global);
                }
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

    register(context: ExtensionContext, contextManager: ContextManager, stateManager: StateManager): vscode.Disposable {
        this.stateManager = stateManager;
        this.contextManager = contextManager;
        this.context = context;

        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return vscode.Disposable.from(this.options, this);
    }
}

export const metadataModule = new MetadataModule();