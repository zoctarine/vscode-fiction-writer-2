import {
	FwFileManager, FwItemBuilder, FwItemFactory,
	FwPermission,
	FwSubType,
	FwType,
	IAsyncCommand, log,
	notifier, ObjectProps,
	Permissions, retryAsync,
	SuffixOrderParser
} from '../../../core';
import vscode, {TextDocument} from 'vscode';
import {StateManager} from '../../../core/state';

/**
 * Reveals a file item in the VSCode Explorer view
 */
export class SplitActiveFile implements IAsyncCommand<vscode.TextEditor, void> {

	constructor(private _fileManager: FwFileManager,
				private _stateManager: StateManager,
				private _fwItemFactory: FwItemFactory) {
	}

	async runAsync(editor?: vscode.TextEditor): Promise<void> {
		const doc = editor?.document;
		if (!doc) return;
		const fwItem = this._stateManager.get(doc.uri.fsPath)?.fwItem;
		if (!fwItem) return;
		if (!Permissions.check(fwItem?.info, FwPermission.Write)) return;
		const newInfo = ObjectProps.deepClone(fwItem.info);
		if (editor?.selection) {
			if (!editor?.selection.isEmpty) {
				newInfo.name = editor.document.getText(editor.selection);
			}
		}

		let newPath = undefined;
		const newFsRef = await this._fwItemFactory.createSiblingItem(fwItem);
		log.tmp("NEW", newFsRef?.fsRef.fsPath);
		if (newFsRef) {
			newPath = await this._fileManager.splitFile(fwItem.fsRef.fsPath,
				editor.selection.start.line,
				editor.selection.start.character,
				newFsRef.fsRef.fsPath);
		}

		if (newPath) {
			await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(newPath));
		} else {
			notifier.warn("File cannot be split");
		}
	}
}