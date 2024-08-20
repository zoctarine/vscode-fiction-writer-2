import * as vscode from 'vscode';
import {addCommand} from '../../../core/commandExtensions';
import {ProseMirrorEditorProvider} from '../proseMirrorEditorProvider';
import {RtEditorOptions} from '../rtEditorOptions';

export const openInProseMirror = () => addCommand('editors.proseMirror.openInProseMirror',
    async () => {
        if (vscode.window.activeTextEditor) {
            const docUri = vscode.window.activeTextEditor?.document.uri;
            if (!docUri) return;

            vscode.commands.executeCommand('vscode.openWith',
                docUri,
                ProseMirrorEditorProvider.viewType);
        }
    });

