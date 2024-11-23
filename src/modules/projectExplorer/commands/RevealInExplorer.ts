import {FwFileManager, FwPermission, FwSubType, FwType, IAsyncCommand, notifier, Permissions} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode from 'vscode';
import {FwItem} from '../../../core/fwFiles/FwItem';

/**
 * Reveals a file item in the VSCode Explorer view
 */
export class RevealInExplorer implements IAsyncCommand<FwItem, void> {

    async runAsync(item?: FwItem):Promise<void> {
        if (!item) return;

        if (!item?.fsRef?.fsPath) return;

        const uri = vscode.Uri.file(item.fsRef.fsPath);
        const options = {reveal: true};

        return vscode.commands.executeCommand('revealInExplorer', uri, options);
    }
}