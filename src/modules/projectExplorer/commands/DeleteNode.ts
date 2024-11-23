import {FwFileManager, FwPermission, FwSubType, FwType, IAsyncCommand, notifier, Permissions} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode from 'vscode';

export class DeleteNode implements IAsyncCommand<ProjectNode, void> {
    constructor(private _fileManager: FwFileManager) {
    };

    async runAsync(node?: ProjectNode) {
        if (!node) return;

        if (node && Permissions.check(node.data.fwItem?.info, FwPermission.Delete)) {
            let selection: string | undefined;
            let deleteOption = 'Delete';
            let displayName = node.data.fwItem?.fsRef?.fsBaseName;

            if (node.data.fwItem?.info.subType === FwSubType.Folder &&
                node.children?.length > 0) {
                selection = await vscode.window.showInformationMessage("The folder is not empty. Are you sure you want to delete it and all it's children?", {
                    detail: displayName,
                    modal: true,
                }, deleteOption);
            } else {
                selection = await vscode.window.showInformationMessage("Are you sure you want to delete this file?", {
                    detail: displayName,
                    modal: true,
                }, deleteOption);
            }

            if (selection === deleteOption) {
                try {
                    await this._fileManager.delete(node.id);
                } catch (err) {
                    notifier.warn(`Could not delete ${displayName}`, err);
                }
            }
        }
    }
}