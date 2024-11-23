import {
    FwFileManager,
    FwPermission,
    FwSubType,
    FwType,
    IAsyncCommand,
    notifier,
    Permissions,
    SimpleSuffixOrderParser
} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode, {QuickPickItemKind} from 'vscode';
import {FwItem} from '../../../core/fwFiles/FwItem';

export class CombineFiles implements IAsyncCommand<FwItem[], void> {
    constructor(private _fileManager: FwFileManager) {
    };

    async runAsync(items: FwItem[]): Promise<void> {
        if (!items || items.length < 2) return;

        const names = items.map((i) => ({
            label: i.fsRef?.fsName ?? '',
            kind: QuickPickItemKind.Default,
            detail: i.fsRef?.fsPath,
            description: i.fsRef?.fsExt
        }));

        const name = await vscode.window.showQuickPick(names, {
            title: "Select the file to merge into"
        });
        if (!name) return;
        let mergePath = name.detail;

        const optionOk = 'Ok';
        const result = await vscode.window.showWarningMessage("Combine files", {
            modal: true,
            detail: 'Are you sure you want to append contents of: \n\n' +
                items.filter(i => i.fsRef?.fsPath !== mergePath).map(i => i.info.name).join("\n") + "\n\n" +
                ' to:\n\n' + name.label + "?" +
                "\n\n This action CANNOT be undone!"
        }, optionOk);

        if (result === optionOk) {
            let mergedText = '';
            let mergePath = name.detail;
            for (const item of items) {
                let doc = await vscode.workspace.openTextDocument(item.fsRef.fsPath);
                if (!doc) throw new Error("Combine file doesn't exist!");
                const text = doc.getText();
                if (item.fsRef.fsPath === mergePath) {
                    mergedText = text + "\n\n" + mergedText;
                } else {
                    mergedText += "\n\n" + doc.getText();
                }
            }
            await this._fileManager.createFile(mergePath, mergedText);
            for (const item of items) {
                if (item.fsRef.fsPath !== mergePath) {
                    await this._fileManager.delete(item.fsRef.fsPath);
                }
            }
            notifier.info("Files combined successfully!");
        }
    }
}