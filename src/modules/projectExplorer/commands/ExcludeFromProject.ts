import {
    DefaultOrderParser,
    FwFileManager,
    FwItemBuilder,
    FwPermission,
    IAsyncCommand,
    notifier,
    Permissions
} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode from 'vscode';
import {fwPath} from '../../../core/FwPath';
import {FwItem} from '../../../core/fwFiles/FwItem';

/**
 * Exclude files from projects, means removing the project tracking tag to the file name.
 * @param items
 */
export class ExcludeFromProject implements IAsyncCommand<FwItem[], void> {
    constructor(private _fileManager: FwFileManager) {
    };

    async runAsync(items: FwItem[]) {
        const optionSkip = 'Skip this file';
        const renameMap = new Map<string, string>();

        for (const item of items) {
            if (!item) continue;

            if (!Permissions.check(item?.info, FwPermission.RemoveFromProject)) {
                notifier.warn(`Cannot exclude ${item.fsRef.fsBaseName} to project`);
                continue;
            }

            const op = new DefaultOrderParser();
            const oldName = item.info.name;
            const parsed = fwPath.parse(item.fsRef.fsPath);
            const newName = parsed.name.replace(/\.fw$/i, '');
            const orderedName = op.parse(newName);

            const options: string[] = [];
            options.push(`${newName}${parsed.ext}`);

            if (orderedName.order && orderedName.order.length > 0) {
                options.push(`${orderedName.name}${parsed.ext}`);
            }
            options.push(optionSkip);
            const value = await vscode.window.showWarningMessage(
                `Exclude ${oldName}?`,
                {
                    modal: true,
                    detail:
                        `Excluding ${oldName} from the project will change it's name on disk:\n\n` +
                        `Choose new name:`
                },
                ...options);

            if (!value) return;

            if (value !== optionSkip) {
                const newUri = fwPath.join(parsed.dir, value);
                renameMap.set(item.fsRef.fsPath, newUri);
            }
        }

        try {
            await this._fileManager.batchRenameFiles(renameMap);
        } catch (err) {
            notifier.warn(`Could not add all files to project`, err);
        }
    }


}

