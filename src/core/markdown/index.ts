import vscode, {Disposable} from 'vscode';
import {IFileState, StateManager} from '../state';
import {FwFormatOptions} from './formatting';
import {FwFileManager} from '../FwFileManager';
import {FictionWriter} from '../constants';
import {RenameFileOnDisk} from './commands/RenameFileOnDisk';
import {ITextProcessor, processorFactory} from './processors';
import {log} from '../logging';
import {MemFile} from '../memoryFile';

function applyProcessor(formatter: ITextProcessor) {
	if (vscode.window.activeTextEditor?.document) {
		let doc = vscode.window.activeTextEditor.document;
		const result = formatter.process(doc.getText()) ?? '';

		const edit = new vscode.WorkspaceEdit();
		edit.replace(
			doc.uri,
			new vscode.Range(0, 0, doc.lineCount, 0),
			result);
		vscode.workspace.applyEdit(edit);
	}
}

function previewProcessor(formatter: ITextProcessor) {
	if (vscode.window.activeTextEditor?.document) {
		let doc = vscode.window.activeTextEditor.document;
		const content = formatter.process(doc.getText()) ?? '';

		const uri = MemFile.createDocument("preview.fw.md", content);
		const position = new vscode.Position(0, 0);
		const location = new vscode.Location(uri, position);

		vscode.commands.executeCommand('editor.action.peekLocations', doc.uri, position, [location], 'peek');
	}
}


const formatStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

function updateStatusbar(state: IFileState | undefined) {
	if (!state) {
		formatStatusBarItem.hide();
		return;
	}

	formatStatusBarItem.command = {
		arguments: [],
		command: FictionWriter.formatting.statusBar.click,
		title: 'Select Formatter',
		tooltip: ''
	};
	const format = FwFormatOptions.get(state.fwItem?.fsContent.format);
	if (!format) {
		formatStatusBarItem.hide();
		return;
	}
	formatStatusBarItem.text = "$(symbol-text) " + format?.label;
	formatStatusBarItem.tooltip = new vscode.MarkdownString(`**${format?.label}:** \n${format?.description}`);
	formatStatusBarItem.show();
}

export function registerMarkdownFormatters(stateManager: StateManager, fileManager: FwFileManager): vscode.Disposable {

	// TODO: move the statusBarIndentClick outside
	return Disposable.from(
		stateManager.onFilesStateChanged(e => {
			const fsPath = vscode.window.activeTextEditor?.document?.uri.fsPath;
			if (!fsPath) {
				updateStatusbar(undefined);
			} else {
				const ev = e.files.find(f => f.state.fwItem?.fsRef.fsPath === fsPath);
				if (ev) {
					updateStatusbar(ev.state);
				}
			}
		}),
		formatStatusBarItem,
		vscode.window.onDidChangeActiveTextEditor((editor) => updateStatusbar(stateManager.get(editor?.document?.uri.fsPath))),
		vscode.commands.registerCommand(FictionWriter.formatting.statusBar.click, async () => {
			const item = stateManager
				.get(vscode.window.activeTextEditor?.document?.uri?.fsPath)?.fwItem;

			// Cannot change for unknown state
			if (item?.fsContent?.format === undefined) return;

			const currentFormat = FwFormatOptions.get(item.fsContent.format);
			const options = Array
				.from(FwFormatOptions.values())
				.map(
					o => ({
						label: o.label,
						description: o.description,
						value: o.value
					})
				).filter(o => o.value !== currentFormat?.value);
			const result = await vscode.window.showQuickPick(options,
				{
					title: `Change \'${currentFormat?.label}\' formatting to:`,
					placeHolder: `Select new format...`,
				},
			);

			// don't do anything if nothing changed
			if (!result || result?.value === item.fsContent.format) return;

			const ok = await vscode.window.showWarningMessage(
				'Are you sure you want to convert format?',
				{
					modal: true,
					detail: 'Changing format results in renaming file on disc',
				},
				'Yes. Change format and rename file');
			if (!ok) return;

			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			const newItem = await new RenameFileOnDisk(fileManager).runAsync({
				item,
				update: (builder) => builder.withFormat(result?.value),
				skipConfirmation: true
			});
			if (!newItem) return;
			await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(newItem.fsRef.fsPath));

			// TODO: Ask if reformat?
			const shouldFormat = await vscode.window.showInformationMessage(
				'File format changed. Do you want to apply the new formatting?',
				'Yes, apply');
			if (!shouldFormat) return;
			applyProcessor(processorFactory.create(newItem.fsContent.format, currentFormat?.value));
		}),

		/**
		 * Reformat
		 */
		vscode.commands.registerCommand(FictionWriter.formatting.reformat, async () => {
			const item = stateManager
				.get(vscode.window.activeTextEditor?.document?.uri?.fsPath)?.fwItem;
			if (!item) return;

			const currentFormat = item.fsContent?.format;

			// Cannot change for unknown state
			if (currentFormat === undefined) return;
			const options = Array
				.from(FwFormatOptions.values())
				.map(
					o => ({
						label: o.label,
						description: o.description,
						value: o.value
					})
				);
			const result = await vscode.window.showQuickPick(options,
				{
					placeHolder: `Select format...`,
				},
			);

			if (!result) return;
			const nextFormat = result.value;

			previewProcessor(processorFactory.create(nextFormat, currentFormat));
		}),

		/**
		 * Register Document Formatting Providers
		 */
		vscode.languages.registerDocumentFormattingEditProvider(FictionWriter.languages.FW_MARKDOWN, {

			provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
				let edits: vscode.TextEdit[] = [];

				const state = stateManager.get(document?.uri?.fsPath);
				if (!state) return edits;

				const markdownContent = document.getText();

				try {
					const result = processorFactory.create(state.fwItem?.fsContent.format, state.fwItem?.fsContent.format).process(markdownContent) ?? '';

					edits.push(new vscode.TextEdit(
						new vscode.Range(0, 0, document.lineCount, 0),
						result));

				} catch (err) {
					console.error(err);
				}
				return edits;
			}
		})
	);
}