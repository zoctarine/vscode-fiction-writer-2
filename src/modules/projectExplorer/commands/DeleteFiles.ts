import {FwFileManager, FwPermission, FwSubType, FwType, IAsyncCommand, log, notifier, Permissions} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode from 'vscode';
import {FwItem} from '../../../core/fwFiles/FwItem';

export class DeleteFiles implements IAsyncCommand<FwItem[], void> {
	constructor(private _fileManager: FwFileManager) {
	};

	async runAsync(items?: FwItem[]) {
		if (!items) return;
		if (items.filter(i => !Permissions.check(i.info, FwPermission.Delete)).length > 0) {
			vscode.window.showWarningMessage('Cannot delete files.');
			return;
		}
		let deleteOption = 'Delete';
		let skipOptions = 'Skip';
		const toDelete = [];
		for (const item of items) {
			let selection: string | undefined;

			let displayName = item.fsRef?.fsBaseName;

			if (item.info.subType === FwSubType.Folder &&
				item.children?.length > 0) {
				selection = await vscode.window.showInformationMessage("The folder is not empty. Are you sure you want to delete it and all it's children?", {
					detail: displayName,
					modal: true,
				}, deleteOption, skipOptions);

				if (selection === deleteOption) {
					toDelete.push({name: `${item.fsRef.fsBaseName}/*`, fsPath: item.fsRef.fsPath});
				}
			} else {
				toDelete.push({name: item.fsRef.fsBaseName, fsPath: item.fsRef.fsPath});
			}
		}
		if (toDelete.length === 0) return;

		const selection = await vscode.window.showInformationMessage("Are you sure you want to delete:", {
			detail: toDelete.map(i => i.name).join('\n'),
			modal: true,
		}, deleteOption);

		if (selection === deleteOption) {
			try {
				await this._fileManager.delete(toDelete.map(i => i.fsPath));
			} catch (err) {
				notifier.warn(`Could not delete files`, err);
			}
		}
	}
}