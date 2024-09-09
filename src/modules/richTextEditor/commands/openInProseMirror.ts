import * as vscode from 'vscode';
import {addCommand} from '../../../core/commandExtensions';
import {ProseMirrorEditorProvider} from '../proseMirrorEditorProvider';

export const openInProseMirror = () => addCommand('editors.proseMirror.openInProseMirror',
    async () => {
        if (vscode.window.activeTextEditor) {
            const docUri = vscode.window.activeTextEditor?.document.uri;
            if (!docUri) return;

            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            await vscode.commands.executeCommand('vscode.openWith',
                docUri,
                ProseMirrorEditorProvider.viewType);

        }
    });

