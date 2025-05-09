import vscode, {Disposable, QuickPickItemKind} from 'vscode';
import {IFileState, StateManager} from '../state';
import {FwFormatOptions, FwFormatting, FwMarkdownFileFormat} from './formatting';
import {FwFileManager} from '../FwFileManager';
import {FictionWriter} from '../constants';
import {RenameFileOnDisk} from './commands/RenameFileOnDisk';
import {ITextProcessor, processorFactory} from './processors';
import {log} from '../logging';
import {MemFile} from '../memoryFile';

async function applyProcessor(formatter: ITextProcessor) {
	if (vscode.window.activeTextEditor?.document) {
		let doc = vscode.window.activeTextEditor.document;
		const result = formatter.run(doc.getText()) ?? '';

		const edit = new vscode.WorkspaceEdit();
		edit.replace(
			doc.uri,
			new vscode.Range(0, 0, doc.lineCount, 0),
			result);
		await vscode.workspace.applyEdit(edit);
	}
}

function previewProcessor(formatter: ITextProcessor, currentFormat: FwMarkdownFileFormat) {
	if (vscode.window.activeTextEditor?.document) {
		const doc = vscode.window.activeTextEditor.document;
		const text = doc.getText() ?? '';
		const locations: vscode.Location[] = [];

		for (const format of Array.from(FwFormatOptions.values())) {
			const processor = processorFactory.create({format: format.value, convertFrom: currentFormat});
			if (processor) {
				const content = processor.run(text) ?? '';
				const uri = MemFile.createDocument(`${format.label}.fw.md`, content);
				const position = new vscode.Position(0, 0);
				locations.push(new vscode.Location(uri, position));
			}
		}

		vscode.commands.executeCommand('editor.action.peekLocations', doc.uri, new vscode.Position(0, 0), locations, 'peek');
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

			const currentFormat = FwFormatOptions.get(item.fsContent.format) ?? FwFormatOptions.get(FwMarkdownFileFormat.Standard)!;
			const options = Array
				.from(FwFormatOptions.values())
				.map(
					o => ({
						label: o.label,
						description: o.description,
						value: o.value,
						kind: vscode.QuickPickItemKind.Default,
					})
				).filter(o => o.value !== currentFormat.value);
			const resultTo = await vscode.window.showQuickPick(options,
				{
					title: `Change formatting to:`,
					placeHolder: `Select new format...`,
				},
			);
			if (!resultTo || resultTo?.value === item.fsContent.format) return;


			const ok = await vscode.window.showWarningMessage(
				`Are you sure you want to convert from '${currentFormat.label}' to '${resultTo.label}'?`,
				{
					modal: true,
					detail: 'Changing format results in renaming file on disc',
				},
				'Yes. Change format and rename file');
			if (!ok) return;


			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			const newItem = await new RenameFileOnDisk(fileManager).runAsync({
				item,
				update: (builder) => builder.withFormat(resultTo?.value),
				skipConfirmation: true
			});
			if (!newItem) return;
			await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(newItem.fsRef.fsPath));

			let optionsFrom = options.map(o => ({...o, label: `Converting from ${o.label}`, description:'' }));
			optionsFrom.splice(0,0,
				{label:"current", kind: vscode.QuickPickItemKind.Separator, description: 'desc', value: currentFormat.value},
				{...currentFormat, label: `Converting from ${currentFormat.label}`, description:'', kind: vscode.QuickPickItemKind.Default},);

			const resultFrom = await vscode.window.showQuickPick(optionsFrom,
				{
					title: `Apply new format`,
					placeHolder: `Make sure the previous format is properly selected. Detected: ${currentFormat.label}`,
				},
			);

			// don't do anything if nothing changed
			if (!resultFrom) return;

			await applyProcessor(processorFactory.create({
				format: resultTo.value,
				convertFrom: resultFrom.value
			}));

			await vscode.window.activeTextEditor?.document?.save();

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

			previewProcessor(processorFactory.create({format: nextFormat, convertFrom: currentFormat}), currentFormat);
		}),

		/**
		 * Register Document Formatting Providers
		 */
		vscode.languages.registerDocumentFormattingEditProvider(FictionWriter.languages.FW_MARKDOWN, {

			async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
				const options = [
					'Try to keep all empty lines',
					'Use standard Markdown formatting'
				];

				const answer = await vscode.window.showQuickPick(options);

				if (!answer) return [];

				let edits: vscode.TextEdit[] = [];

				const state = stateManager.get(document?.uri?.fsPath);
				if (!state) return edits;

				const markdownContent = document.getText();

				try {
					const result = processorFactory
						.create({format: state.fwItem?.fsContent.format, settings: {
								keepEmptyLines: answer === options[0]
							}})
						.run(markdownContent) ?? '';

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