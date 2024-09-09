import * as vscode from "vscode";
import {addCommand, CoreModule, DisposeManager, FictionWriter, mapExtensions} from '../../core';
import {ContextManager} from '../../core/contextManager';
import {MetadataTreeDataProvider} from './metadataTreeDataProvider';
import {MetadataOptions} from './metadataOptions';
import {ExtensionContext} from 'vscode';
import {MetadataTreeDecorationProvider} from './metadataDecoration';
import {ColorResolver, IconResolver} from './iconsAndColors';
import {StateManager} from '../../core/state';
import {ProjectsOptions} from '../projectExplorer/projectsOptions';
import {FilterTreeDataProvider} from './filterTreeDataProvider';
import {ActiveDocumentMonitor} from '../../core/fwFiles/activeDocumentMonitor';

export * from './iconsAndColors';

class MetadataModule extends DisposeManager {
    active = false;
    private core!: CoreModule;
    private context: ExtensionContext | undefined;
    private options = new MetadataOptions();
    metadataTreeDataProvider: MetadataTreeDataProvider | undefined;
    filterDataProvider: FilterTreeDataProvider | undefined;
    private metadataDecorationProvider: MetadataTreeDecorationProvider | undefined;
    resolvers = {
        iconResolver: new IconResolver(),
        colorResolver: new ColorResolver(),
    };
    private projectsOptions!: ProjectsOptions;

    constructor() {
        super();
    }

    activate(): void {
        this.resolvers.iconResolver.setCustom(mapExtensions.objectToMap(this.options.metadataIcons.value));
        this.resolvers.colorResolver.setCustom(mapExtensions.objectToMap(this.options.metadataColors.value));

        this.metadataTreeDataProvider = new MetadataTreeDataProvider(this.options, this.core.stateManager, this.resolvers, this.core.activeDocumentMonitor);
        this.metadataDecorationProvider = new MetadataTreeDecorationProvider(this.resolvers);
        this.filterDataProvider = new FilterTreeDataProvider(
            this.options, this.core.stateManager, this.core.contextManager!,
            this.metadataTreeDataProvider,
            this.resolvers!);

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
                if (item?.data.key) {
                    this.projectsOptions.fileDescriptionMetadataKey.update(item.data.key);
                }
            }),

            addCommand('views.metadata.filters.hideFilter', (e) => {
                this.filterDataProvider?.toggleFilter(e?.data?.name);
            }),
            addCommand('views.metadata.filters.showFilter', (e) => {
                this.filterDataProvider?.toggleFilter(e?.data?.name);
            }),
            addCommand('views.metadata.filters.setFilter', () => {
                this.filterDataProvider?.setFilter();
            }),
            addCommand('views.metadata.filters.removeFilter', () => {
                this.filterDataProvider?.removeFilter();
            }),
            addCommand('views.metadata.filters.linkWithFileView.on', () => {
                this.filterDataProvider?.toggleMetadataViewLink();
            }),
            addCommand('views.metadata.filters.linkWithFileView.off', () => {
                this.filterDataProvider?.toggleMetadataViewLink();
            }),
        );
    };

    deactivate(): void {
        this.dispose();
        this.metadataTreeDataProvider = undefined;
        this.filterDataProvider = undefined;
        this.metadataDecorationProvider = undefined;
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(context: ExtensionContext,
            core: CoreModule): vscode.Disposable {
        this.core = core;
        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return vscode.Disposable.from(this.options, this);
    }
}

export const metadataModule = new MetadataModule();