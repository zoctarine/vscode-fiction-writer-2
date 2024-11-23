import {FwFileManager, FwItemBuilder, FwPermission, IAsyncCommand, notifier, Permissions} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode from 'vscode';
import {fwPath} from '../../../core/FwPath';
import {FwItem} from '../../../core/fwFiles/FwItem';

/**
 * Adding a file to project, means adding the project tracking tag to the file name.
 */
export class AddToProject implements IAsyncCommand<FwItem[], void> {
    constructor(private _fileManager: FwFileManager) {
    };

    async runAsync(items: FwItem[]) {
        const renameMap = new Map<string, string>();

        for (const fwItem of items) {
            if (!fwItem) continue;

            if (!Permissions.check(fwItem?.info, FwPermission.AddToProject)) {
                notifier.warn(`Cannot add ${fwItem.fsRef.fsBaseName} to project`);
                continue;
            }
            const oldPath = fwItem?.fsRef.fsPath;
            const parsed = fwPath.parse(oldPath);
            const newPath = fwPath.join(parsed.dir, `${parsed.name}.fw${parsed.ext}`);
            renameMap.set(oldPath, newPath);
        }

        try {
            await this._fileManager.batchRenameFiles(renameMap);
        } catch (err) {
            notifier.warn(`Could not add all files to project`, err);
        }
    }


}

