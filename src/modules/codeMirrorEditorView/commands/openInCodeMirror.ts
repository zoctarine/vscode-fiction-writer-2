
import * as vscode from 'vscode';
import { addCommand } from '../../../common/commandExtensions';

export const openInCodeMirror = () => addCommand('codeMirror.openInCodeMirror',
    () => {
                
       if (vscode.window.activeTextEditor) {
        vscode.commands.executeCommand('vscode.openWith',
            vscode.window.activeTextEditor?.document.uri,
            'fictionWriter2.codeMirrorEditor');
        } 
    });

