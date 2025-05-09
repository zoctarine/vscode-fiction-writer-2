import {
	PrefixOrderParser,
	FwFileManager, FwItemBuilder,
	FwPermission,
	FwSubType,
	FwType,
	IAsyncCommand, IFsRef, log,
	notifier, ObjectProps,
	Permissions
} from '../../../core';
import vscode from 'vscode';
import {StateManager} from '../../../core/state';
import {fwPath} from '../../../core/FwPath';
import {FwItemOption, fwFilenameInput, fwItemPicker} from '../../../core/inputs';
import {FwItemReplicator} from '../../../core/fwFiles/FwItemReplicator';

/**
 * Reveals a file item in the VSCode Explorer view
 */
const l = log.for("ExtractFile");

export class ExtractFile implements IAsyncCommand<vscode.TextEditor, void> {

	constructor(private _fileManager: FwFileManager,
				private _stateManager: StateManager,
				private _fwItemBuilder: FwItemBuilder) {
	}

	async runAsync(editor?: vscode.TextEditor): Promise<void> {
		if (!editor) return;
		const doc = editor?.document;
		if (!doc) return;
		const fwItem = this._stateManager.get(doc.uri.fsPath)?.fwItem;
		if (!fwItem) return;
		if (!Permissions.check(fwItem?.info, FwPermission.Write)) return;
		const newInfo = ObjectProps.deepClone(fwItem.info);

		if (!editor?.selection || editor.selection.isEmpty) return;

		const edit = new vscode.WorkspaceEdit();
		const lines = editor.selections.map(selection => {
			edit.delete(doc.uri, selection);
			return doc.getText(selection);
		});
		if (lines.length === 0) return;

		const content = lines.reduce((acc, f) => acc + f, "");
		const builder = new FwItemReplicator(fwItem, this._fwItemBuilder);

		const extracted = await builder
			.withFilename(fwPath.toFilename(lines.join(' ')))
			.incrementMainOrder()
			.executeAsync();
		const nextPath = await builder.incrementMainOrder().executeAsync();
		const nextOrdered = await builder.incrementSubOrder().executeAsync();
		let selectedItem = await fwItemPicker([
			new FwItemOption(extracted, 'from selection'),
			new FwItemOption(nextPath, 'As sibling with same name'),
			new FwItemOption(nextOrdered, 'As duplicate')
		]);
		if (!selectedItem) {
			return;
		}
		const fileName = await fwFilenameInput(selectedItem);
		if (!fileName) return;
		const newItem = await builder.withBasename(fileName).executeAsync();
		const createdFile = await this._fileManager.createFile(newItem.fsRef.fsPath, content);
		if (!createdFile) {
			notifier.warn("Could not create all file");
		}

		if (await vscode.workspace.applyEdit(edit)) {
			// doc.save();
		}
	}
}


