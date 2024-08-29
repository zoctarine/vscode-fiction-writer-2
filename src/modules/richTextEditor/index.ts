import {DisposeManager} from '../../core';
import {ContextManager} from '../../core/contextManager';
import vscode from 'vscode';
import {ProseMirrorEditorProvider} from './proseMirrorEditorProvider';
import * as commandBuilder from './commands';
import {RtEditorOptions} from './rtEditorOptions';
import {DoNothingEditor} from './doNothingEditor';


class RichTextEditorModule extends DisposeManager {
    active = false;
    contextManager: ContextManager | undefined;
    context: vscode.ExtensionContext | undefined;
    options = new RtEditorOptions();
    doNothingEditor:vscode.Disposable|undefined;

    constructor() {
        super();
    }

    activate(): void {
        this.doNothingEditor?.dispose();
        this.doNothingEditor = undefined;

        this.manageDisposable(
            ProseMirrorEditorProvider.register(this.context!, this.contextManager!, this.options),

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

    register(context: vscode.ExtensionContext, contextManager: ContextManager): vscode.Disposable {
        this.contextManager = contextManager;
        this.context = context;

        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return vscode.Disposable.from(this.options, this);
    }
}

export const richTextEditorModule = new RichTextEditorModule();