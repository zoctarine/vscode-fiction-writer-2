import {addCommand, CoreModule, DisposeManager} from '../../core';
import {ContextManager} from '../../core/contextManager';
import vscode from 'vscode';
import {ProseMirrorEditorProvider} from './proseMirrorEditorProvider';
import * as commandBuilder from './commands';
import {RtEditorOptions} from './rtEditorOptions';
import {DoNothingEditor} from './doNothingEditor';
import {ActiveDocumentMonitor} from '../../core/activeDocumentMonitor';


class RichTextEditorModule extends DisposeManager {
    active = false;
    core!: CoreModule;
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
            ProseMirrorEditorProvider.register(this.context!,
                this.core.contextManager!,
                this.core.activeDocumentMonitor,
                this.options),
            commandBuilder.openInProseMirror(),
            addCommand('editors.proseMirror.openInTextEditor',
                async () => {

                    const docUri = this.core.activeDocumentMonitor.activeDocument?.uri;
                    if (!docUri) return;

                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    await vscode.commands.executeCommand('vscode.open', docUri);
                })
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

    register(context: vscode.ExtensionContext, core: CoreModule): vscode.Disposable {
        this.core = core;
        this.context = context;

        this.options.enabled.onChanged((enabled) => {
            this.updateState(enabled);
        });

        this.options.enabled.emit();

        return vscode.Disposable.from(this.options, this);
    }
}

export const richTextEditorModule = new RichTextEditorModule();