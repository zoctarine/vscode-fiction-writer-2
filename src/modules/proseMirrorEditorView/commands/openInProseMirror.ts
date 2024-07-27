
import * as vscode from 'vscode';
import { addCommand } from '../../../core/commandExtensions';

export const openInProseMirror = () => addCommand('proseMirror.openInProseMirror',
    () => {
                
       if (vscode.window.activeTextEditor) {
        vscode.commands.executeCommand('vscode.openWith',
            vscode.window.activeTextEditor?.document.uri,
            'fictionWriter2.proseMirrorEditor');
        } 
    });

