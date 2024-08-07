
import * as vscode from 'vscode';
import { addCommand } from '../../../core/commandExtensions';

export const openInCodeMirror = () => addCommand('editors.codeMirror.openInCodeMirror',
    () => {

       if (vscode.window.activeTextEditor) {
        vscode.commands.executeCommand('vscode.openWith',
            vscode.window.activeTextEditor?.document.uri,
            'fictionWriter.editors.codeMirror');
        }
    });

