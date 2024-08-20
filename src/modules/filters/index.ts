import * as vscode from "vscode";

import {FilterTreeDataProvider} from "./filterTreeDataProvider";
import {FwFileManager} from "../../core/fwFileManager";
import {DisposeManager} from "../../core/disposable";
import * as logger from "../../core/logger";
import {StateManager} from '../../core/stateManager';
import {FilterOptions} from './filterOptions';
import {ColorResolver, IconResolver, ProjectCache} from '../metadata';
import {addCommand} from '../../core';
import {MetadataTreeDataProvider} from '../metadata/metadataTreeDataProvider';

const log = logger.makeLog("[ProjectsModule]", "red");

class FiltersModule extends DisposeManager {
    active = false;
    options = new FilterOptions();
    projectCache!: ProjectCache;
    stateManger!: StateManager;
    filterDataProvider: FilterTreeDataProvider | undefined;
    resolvers: { iconResolver: IconResolver; colorResolver: ColorResolver } | undefined;
    metadataView?: MetadataTreeDataProvider;

    constructor() {
        super();
    }

    activate(): void {
        this.filterDataProvider = new FilterTreeDataProvider(
            this.options, this.projectCache, this.stateManger, this.metadataView, this.resolvers!);

        this.manageDisposable(
            this.filterDataProvider,
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
            })
        );
    };

    deactivate(): void {
        this.dispose();
        this.filterDataProvider = undefined;
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(stateManager: StateManager, cache: ProjectCache, metadataView?: MetadataTreeDataProvider,
             resolvers?: {
                 iconResolver: IconResolver;
                 colorResolver: ColorResolver,
             }): vscode.Disposable {
        this.resolvers = resolvers;
        this.stateManger = stateManager;
        this.metadataView = metadataView;
        this.projectCache = cache;
        this.options.enabled.onChanged((enabled) => {
            console.log("[options.enabled.onChanged]", `to: ${enabled}`);
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return vscode.Disposable.from(this.options, this);
    }
}

export const filtersModule = new FiltersModule();