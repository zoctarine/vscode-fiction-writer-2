import {
	PrefixOrderParser,
	FwFileManager, FwItemBuilder,
	FwPermission,
	FwSubType,
	FwType,
	IAsyncCommand, IFsRef, log,
	notifier, ObjectProps,
	Permissions, retryAsync,
	SuffixOrderParser, IFwInfo, FwProjectFileInfo
} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode, {TextDocument} from 'vscode';
import {FwItem} from '../../../core/fwFiles/FwItem';
import {StateManager} from '../../../core/state';
import {fwPath} from '../../../core/FwPath';
import {typeRampBaseLineHeight} from '@vscode/webview-ui-toolkit/dist/design-tokens';

/**
 * Reveals a file item in the VSCode Explorer view
 */
const l = log.for("ExtractFiles");

export class ExtractFiles implements IAsyncCommand<vscode.TextEditor, void> {

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
		const newInfo = ObjectProps.deepClone(fwItem.info) as IFwInfo;


		// get next order from existing children
		const nextChildOrder = this._fwItemBuilder.fsRefToFwInfo.mainOrderParser.computeNextOrderFor(
			fwItem.children?.map(c => fwPath.parse(c).name) ?? [],
			fwItem.info.mainOrder.order
		);

		if (!editor?.selection || editor.selection.isEmpty) return;

		const optOneFilePerLine = "One file for each selected line(separated by single break)";
		const optOneFilePerParagraph = "One file for each MD paragraph (separated by double break)";
		const optOneFilePerSelection = "One file for selection block (if multiple cursor was used when making selection)";
		const opt = await vscode.window.showQuickPick(
			[optOneFilePerLine, optOneFilePerParagraph, optOneFilePerSelection],
			{
				title: "Select how you want to split the selection"
			}
		);

		if (!opt) return;

		const selectedLines: string[] = [];
		const edit = new vscode.WorkspaceEdit();
		editor.selections.map(selection => {
			switch (opt) {
				case optOneFilePerLine:
					for (let line = selection.start.line; line <= selection.end.line; line++) {
						const lineText = doc.lineAt(line).text;
						if (lineText.length > 0) {
							selectedLines.push(lineText);
						}
					}
					break;
				case optOneFilePerParagraph:
					selectedLines.push(...doc.getText(selection).split(/\n{2,}/));
					break;
				case optOneFilePerSelection:
					selectedLines.push(doc.getText(selection));
					break;
			}


			edit.delete(doc.uri, selection);
		});
		if (selectedLines.length === 0) return;


		const originalOrder = [...newInfo.mainOrder.order];
		const fileMap = new Map<string, string>();
		const filenames: string[] = [];
		const originalItemReplicator = this._fwItemBuilder
			.createReplicator(fwItem);

		for (let line = 0; line < selectedLines.length; line++) {
			const lineText = selectedLines[line];
			const newItem = await originalItemReplicator
				.withFilename(fwPath.toFilename(lineText))
				.withMainOrder([...originalOrder, line + nextChildOrder])
				.executeAsync();

			const {fsBaseName, fsPath} = newItem.fsRef;

			filenames.push(fsBaseName);
			fileMap.set(fsPath, lineText);
		}

		const optionOk = 'Ok';
		const result = await vscode.window.showWarningMessage("Create individual files for each line", {
			modal: true,
			detail: `The selected text will be split into ${fileMap.size} files: \n\n` +
				filenames.join("\n") +
				"\n\n This action CANNOT be undone!"
		}, optionOk);
		if (result !== optionOk) return;
		const createdFiles = await this._fileManager.batchCreateFiles(fileMap);
		if (createdFiles.length !== fileMap.size) {
			notifier.warn("Could not create all files");
		}

		if (await vscode.workspace.applyEdit(edit)) {
			// doc.save();
		}
	}
}


