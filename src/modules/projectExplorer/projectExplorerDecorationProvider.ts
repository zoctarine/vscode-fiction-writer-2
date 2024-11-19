import {
    window, Uri, Disposable, Event,
    EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor
} from 'vscode';
import vscode from 'vscode';
import {FictionWriter, log} from '../../core';
import {StateManager} from '../../core/state';
import {FwControl, FwType} from '../../core/fwFiles';
import {FwColors, CoreColors} from '../../core/decorations';

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
                        .filter(p => p.state.fwItem?.fsRef?.fsPath)
                        .map(p => vscode.Uri.parse(p.state.fwItem!.fsRef!.fsPath)
                            .with({scheme: FictionWriter.views.projectExplorer.id}))
                );
            })
        );
    }

    async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {

        if (uri.scheme !== FictionWriter.views.projectExplorer.id) {
            return;
        }
        const decoration: FileDecoration = {};

        const item = this._stateManager.get(uri.fsPath);

        if (!item) return {
            color: new ThemeColor(CoreColors.missing)
        };

        if (item.decorations?.highlightColor) {
            decoration.color = new ThemeColor(item.decorations.highlightColor);
        }

        if (item.decorations?.badge){
            decoration.badge = item.decorations.badge;
        }

        return decoration;
    }

    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}

