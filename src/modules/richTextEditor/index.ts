import {DisposeManager, FileManager} from '../../core';
import {StateManager} from '../../core/stateManager';
import vscode from 'vscode';
import {ProseMirrorEditorProvider} from './proseMirrorEditorProvider';
import * as commandBuilder from './commands';
import {RtEditorOptions} from './rtEditorOptions';
import {DoNothingEditor} from './doNothingEditor';


class RichTextEditorModule extends DisposeManager {
    active = false;
    stateManager: StateManager | undefined;
    context: vscode.ExtensionContext | undefined;
    fileManager: FileManager | undefined;
    options = new RtEditorOptions();
    doNothingEditor:vscode.Disposable|undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.doNothingEditor?.dispose();
        this.doNothingEditor = undefined;

        this.manageDisposable(
            ProseMirrorEditorProvider.register(this.context!, this.stateManager!, this.options),

            commandBuilder.openInProseMirror(),
        );
    };

    deactivate(): void {
        this.dispose();

        this.doNothingEditor = DoNothingEditor.register();
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(context: vscode.ExtensionContext, stateManager: StateManager, fileManager: FileManager): vscode.Disposable {
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

export const richTextEditorModule = new RichTextEditorModule();