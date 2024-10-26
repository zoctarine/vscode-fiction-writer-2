import {
    window, Uri, Disposable, Event,
    EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor
} from 'vscode';
import vscode from 'vscode';
import {FictionWriter, log} from '../../core';
import {StateManager} from '../../core/state';
import {FwControl, FwType} from '../../core/fwFiles';

export class ProjectExplorerDecorationProvider implements FileDecorationProvider {

    private disposables: Array<Disposable> = [];

    private readonly _onDidChangeFileDecorations: EventEmitter<Uri | Uri[]> = new EventEmitter<Uri | Uri[]>();
    readonly onDidChangeFileDecorations: Event<Uri | Uri[]> = this._onDidChangeFileDecorations.event;

    constructor(private _stateManager: StateManager) {
        this.disposables = [];
        this.disposables.push(
            window.registerFileDecorationProvider(this),
            this._stateManager.onFilesStateChanged((f) => {
                this._onDidChangeFileDecorations.fire(
                    f.files
                        .filter(p => p.state.fileInfo?.fsPath)
                        .map(p => vscode.Uri.parse(p.state.fileInfo!.fsPath).with({scheme: FictionWriter.views.projectExplorer.id}))
                );
            })
        );
    }

    async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
        if (uri.scheme !== FictionWriter.views.projectExplorer.id) {
            return;
        }

        const item = this._stateManager.get(uri.fsPath);
        if (!item?.decoration) return undefined;
        const decoration: FileDecoration = {};

        if (item.decoration.highlightColor) {
            decoration.color = new ThemeColor(item.decoration.highlightColor);
        }

        if (item.decoration.badge){
            decoration.badge = item.decoration.badge;
        }

        if (item.fileInfo?.control !== FwControl.Active){
            decoration.color = new ThemeColor('disabledForeground');
        }
        return decoration;
    }

    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}

