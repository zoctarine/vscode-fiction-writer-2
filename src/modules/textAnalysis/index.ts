import * as vscode from "vscode";
import {addCommand, DisposeManager} from '../../core';
import {ContextManager} from '../../core/contextManager';
import {TextAnalysisOptions} from './textAnalysisOptions';
import {WordFrequencyTreeDataProvider} from './wordFrequencyTreeDataProvider';
import {DocStatisticTreeDataProvider} from './docStatisticTreeDataProvider';
import {WordStatTreeItemSelector} from './wordStatTreeItemSelector';
import {StateManager} from '../../core/state';


class TextAnalysisModule extends DisposeManager {
	active = false;
	options = new TextAnalysisOptions();
	wfTreeDataProvider: WordFrequencyTreeDataProvider | undefined;
	dsTreeDataProvider: DocStatisticTreeDataProvider | undefined;
	stateManager: StateManager | undefined;

	constructor() {
		super();
	}

	activate(): void {
		this.wfTreeDataProvider = new WordFrequencyTreeDataProvider();
		this.dsTreeDataProvider = new DocStatisticTreeDataProvider(this.stateManager!);

		this.manageDisposable(
			this.wfTreeDataProvider,
			this.dsTreeDataProvider,
			addCommand('views.wordFrequency.next.up', (e) => {
				WordStatTreeItemSelector.prev([e]);
			}),
			addCommand('views.wordFrequency.next.down', (e) => {
				WordStatTreeItemSelector.next([e]);
			}),
			addCommand('views.wordFrequency.refresh', () => {
				this.wfTreeDataProvider?.refresh();
			}),
			addCommand('views.wordFrequency.open', () => {
				this.wfTreeDataProvider?.open();
			}),
			addCommand('views.wordFrequency.clear', () => {
				this.wfTreeDataProvider?.clear();
			}),
			addCommand('views.statistics.refresh', () => {
				this.dsTreeDataProvider?.refresh(true);
			}),
			vscode.window.onDidChangeActiveTextEditor(() => {
				if (this.options.autoRefresh) {
					this.wfTreeDataProvider?.refresh();
					this.dsTreeDataProvider?.refresh();
				}
			}),
		);
	};

	deactivate(): void {
		this.dispose();
		this.wfTreeDataProvider = undefined;
		this.dsTreeDataProvider = undefined;
	};

	private updateState(enabled: boolean) {
		return enabled
			? this.activate()
			: this.deactivate();
	}

	register(stateManager: StateManager): vscode.Disposable {
		this.stateManager = stateManager;

		this.options.enabled.onChanged((enabled) => {
			this.updateState(enabled);
		});
		this.options.enabled.emit();

		return vscode.Disposable.from(this.options, this);
	}
}

export const textAnalysisModule = new TextAnalysisModule();