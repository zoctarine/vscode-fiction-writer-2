import * as vscode from "vscode";

import {FilterTreeDataProvider} from "./filterTreeDataProvider";
import {FwFileManager} from "../../core/fwFileManager";
import {DisposeManager} from "../../core/disposable";
import * as logger from "../../core/logger";
import {StateManager} from '../../core/stateManager';
import {FilterOptions} from './filterOptions';
import {ProjectCache} from '../metadata';
import {addCommand} from '../../core';

const log = logger.makeLog("[ProjectsModule]", "red");

class FiltersModule extends DisposeManager {
    active = false;
    options = new FilterOptions();
    projectCache!: ProjectCache;
    stateManger!: StateManager;
    filterDataProvider: FilterTreeDataProvider | undefined;

    constructor() {
        super();
    }

    activate(): void {
        log.debug("activate");

        this.filterDataProvider = new FilterTreeDataProvider(this.options, this.projectCache, this.stateManger);

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

    register(stateManager: StateManager, cache: ProjectCache): vscode.Disposable {

        this.stateManger = stateManager;
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