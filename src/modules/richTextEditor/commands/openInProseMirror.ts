import * as vscode from 'vscode';
import {addCommand} from '../../../core/commandExtensions';
import {ProseMirrorEditorProvider} from '../proseMirrorEditorProvider';

export const openInProseMirror = () => addCommand('editors.proseMirror.openInProseMirror',
    () => {
        if (vscode.window.activeTextEditor) {
            vscode.commands.executeCommand('vscode.openWith',
                vscode.window.activeTextEditor?.document.uri,
                ProseMirrorEditorProvider.viewType);
        }
    });

