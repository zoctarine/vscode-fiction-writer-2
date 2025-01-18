import {FwFileManager, FwItemBuilder, IAsyncCommand, log} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode from 'vscode';
import {fwPath} from '../../../core/FwPath';
import {fwFilenameInput} from '../../../core/inputs';
import {RenameFileOnDisk} from '../../../core/markdown/commands/RenameFileOnDisk';

export class RenameNode implements IAsyncCommand<ProjectNode, string | undefined> {
	constructor(private _fileManager: FwFileManager, private _fwItemBuilder: FwItemBuilder) {
	};

	async runAsync(node?: ProjectNode) {
		if (!node?.data.fwItem) return;
		const {data: {fwItem}} = node;

		const result = await new RenameFileOnDisk(this._fileManager).runAsync({
			item: fwItem
		});

		return result?.fsRef.fsPath;

		// const nextValue = await fwFilenameInput(fwItem);
		//
		// if (nextValue && nextValue !== fwItem.fsRef.fsBaseName) {
		//     let doRename = await vscode.window.showWarningMessage("Are you sure?",
		//         {
		//             modal: true,
		//             detail: `Renaming\n\n'${fwItem.fsRef.fsBaseName}'\n\nto:\n\n ${nextValue}\n\n may result in FictionWriter handling the file differently.\n\nJust make sure you are OK with this change.`,
		//         },
		//         "OK") === 'OK';
		//
		//     if (doRename) {
		//         try {
		//             const nextPath = fwPath.join(fwItem.fsRef.fsDir, nextValue);
		//             await this._fileManager.renameFile(
		//                 fwItem.fsRef.fsPath,
		//                 nextPath
		//             );
		//             return nextPath;
		//         } catch (err) {
		//             log.warn("Cannot rename file", err);
		//         }
		//     }
		// }
	}
}