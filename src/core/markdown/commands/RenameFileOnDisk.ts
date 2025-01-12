import {IAsyncCommand} from '../../lib';
import {FwItem} from '../../fwFiles/FwItem';
import {FwItemBuilder, FwItemReplicator, FwPermission, Permissions} from '../../fwFiles';
import {FwFileManager} from '../../FwFileManager';
import {fwFilenameInput} from '../../inputs';
import vscode from 'vscode';

export interface IRenameFileOnDiskInput {
    item: FwItem;
    update?: (replicator: FwItemReplicator) => FwItemReplicator;
    skipConfirmation?: boolean;
}

export class RenameFileOnDisk implements IAsyncCommand<IRenameFileOnDiskInput, FwItem | undefined> {

    constructor(private _fileManager: FwFileManager) {
    }

    async runAsync(input:IRenameFileOnDiskInput): Promise<FwItem | undefined> {
        // Only change formatting for project files
        const {item, update} = input;
        if (!Permissions.check(item, FwPermission.Rename)) return;

        let builder = new FwItemReplicator(item, new FwItemBuilder());
        if (update) {
            builder = update(builder);
        } else {
            const newName = await fwFilenameInput(item);
            if (!newName) return;
            builder = builder.withBasename(newName);
        }

        const newItem = await builder.executeAsync();

        if (newItem.fsRef.fsPath !== item.fsRef.fsPath) {
            let doRename = input.skipConfirmation || await vscode.window.showWarningMessage(
                `Rename \`${item.fsRef.fsBaseName}\`\nto \`${newItem.fsRef.fsBaseName}\`?`,
                {
                    modal: true,
                    detail: `Renaming extension may result in FictionWriter handling the file differently.\n\nJust make sure you are OK with this change.`,
                },
                "OK") === 'OK';

            if (doRename) {
                try {
                    await this._fileManager.renameFile(item.fsRef.fsPath, newItem.fsRef.fsPath);
                    return newItem;
                } catch (err) {
                    await vscode.window.showErrorMessage('Cannot rename file. Please try a different name.' ?? 'Error', {
                        modal: true,
                        detail: err?.toString()
                    });
                    return await this.runAsync({
                        item: newItem,
                    });
                }
            }
        }
        return;
    }

}
