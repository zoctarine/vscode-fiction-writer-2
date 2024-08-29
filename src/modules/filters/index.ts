import * as vscode from "vscode";

import {FilterTreeDataProvider} from "./filterTreeDataProvider";
import {DisposeManager} from "../../core/disposable";
import * as logger from "../../core/logger";
import {ContextManager} from '../../core/contextManager';
import {FilterOptions} from './filterOptions';
import {ColorResolver, IconResolver} from '../metadata';
import {addCommand} from '../../core';
import {MetadataTreeDataProvider} from '../metadata/metadataTreeDataProvider';
import {StateManager} from '../../core/state';

const log = logger.makeLog("[ProjectsModule]", "red");

class FiltersModule extends DisposeManager {
    active = false;
    options = new FilterOptions();
    stateManager!: StateManager;
    contextManager!: ContextManager;
    filterDataProvider: FilterTreeDataProvider | undefined;
    resolvers: { iconResolver: IconResolver; colorResolver: ColorResolver } | undefined;
    metadataView?: MetadataTreeDataProvider;

    constructor() {
        super();
    }

    activate(): void {
        this.filterDataProvider = new FilterTreeDataProvider(
            this.options, this.stateManager, this.contextManager, this.metadataView, this.resolvers!);

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

    register(contextManager: ContextManager, stateManager: StateManager, metadataView?: MetadataTreeDataProvider | undefined,
             resolvers?: { iconResolver: IconResolver; colorResolver: ColorResolver }): vscode.Disposable {
        this.resolvers = resolvers;
        this.contextManager = contextManager;
        this.metadataView = metadataView;
        this.stateManager = stateManager;
        this.options.enabled.onChanged((enabled) => {
            console.log("[options.enabled.onChanged]", `to: ${enabled}`);
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return vscode.Disposable.from(this.options, this);
    }
}

export const filtersModule = new FiltersModule();