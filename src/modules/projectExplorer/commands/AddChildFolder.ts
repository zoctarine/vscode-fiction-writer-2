import {FwFileManager, FwPermission, IAsyncCommand, notifier, Permissions} from '../../../core';
import vscode, {InputBoxValidationSeverity} from 'vscode';
import {fwPath} from '../../../core/FwPath';
import {FwItem} from '../../../core/fwFiles/FwItem';

export class AddChildFolder implements IAsyncCommand<FwItem, string | undefined> {
	constructor(private _fileManager: FwFileManager) {
	};

	async runAsync(item?: FwItem): Promise<string | undefined> {
		if (!item?.fsRef) return;

		if (!Permissions.check(item.info, FwPermission.AddChildFolder) ||
			!item.fsRef.fsIsFolder) {
			return;
		}

		const makeFinalPath = (value: string) => fwPath.join(item.fsRef.fsPath, value);
		const folderName = 'Chapter';

		const value = await vscode.window.showInputBox({
			title: `Add folder`,
			prompt: `Folder name:`,
			valueSelection: [0, folderName.length],
			value: folderName,
			validateInput: async (value: string) => {
				if (!value || value === '') {
					return {
						message: "Value must be a valid name",
						severity: InputBoxValidationSeverity.Error
					};
				}

				if (fwPath.exists(makeFinalPath(value))) {
					return {
						message: "The folder name already exists",
						severity: InputBoxValidationSeverity.Error
					};
				}
			}
		});
		if (value) {
			const fsPath = makeFinalPath(value);
			const created = await this._fileManager.createFolder(fsPath);
			if (!created) {
				notifier.warn(`Could not create folder: ${value}`);
			} else {
				return fsPath;
			}
		}

	}
}