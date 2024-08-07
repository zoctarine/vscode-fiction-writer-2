import * as vscode from 'vscode';

export class FileManager{
    get activeTextDocument(): vscode.TextDocument | undefined {
        return vscode.window.activeTextEditor?.document;
    }
}

export const fileManager = new FileManager();