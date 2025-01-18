import remarkStringify from 'remark-stringify';
import remarkParse from 'remark-parse';
import {unified} from 'unified';
import remarkFrontmatter from 'remark-frontmatter';
import {remarkKeepEmptyLines} from './plugins/remarkExpandParagraphs';
import {remarkSplitCodeToParagraphs} from './plugins/splitCodeToParagraph';
import {remarkParagraphsToCodeBlock} from './plugins/mergeParagrapshToCode';
import {remarkDashes} from './plugins/remarkDashes';
import vscode, {Disposable, QuickPickItemKind} from 'vscode';
import {IFileState, StateManager} from '../state';
import {FwFormatOptions, FwFormatting, FwMarkdownFileFormat} from './formatting';
import {FwFileManager} from '../FwFileManager';
import {FictionWriter} from '../constants';
import {RenameFileOnDisk} from './commands/RenameFileOnDisk';

function fromCustomToStandard() {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml'])
		.use(remarkDashes)
		.use(remarkKeepEmptyLines)
		.use(remarkSplitCodeToParagraphs)
		.use(remarkStringify, {
			fences: false
		});
}

function fromStandardToCustom() {
	return unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml'])
		.use(() => (tree: any, file: any) => {
			file.data.matter = {cool: "stuff"};
		})
		.use(remarkDashes)
		.use(remarkKeepEmptyLines)
		.use(remarkParagraphsToCodeBlock)
		.use(remarkStringify, {
			fences: false,
			// join: [(left:any, right:any, parent:any, state:any) => (left.type === 'paragraph' && right.type==='paragraph') ? 0 : 1]
		});
}

function applyProcessor(formatter: any) {
	if (vscode.window.activeTextEditor?.document) {
		let doc = vscode.window.activeTextEditor.document;
		const result = formatter.processSync(doc.getText()).toString();

		const edit = new vscode.WorkspaceEdit();
		edit.replace(
			doc.uri,
			new vscode.Range(0, 0, doc.lineCount, 0),
			result);
		vscode.workspace.applyEdit(edit);
	}
}

function getProcessor(format?: FwMarkdownFileFormat) {
	switch (format) {
		case FwMarkdownFileFormat.IndentFirstLine:
			return fromStandardToCustom();
		default:
			return fromCustomToStandard();
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

			const current = FwFormatOptions.get(item.fsContent.format);
			const options = Array
				.from(FwFormatOptions.values())
				.map(
					o => ({
						label: o.label,
						description: o.description,
						value: o.value
					})
				).filter(o => o.value !== current?.value);
			const result = await vscode.window.showQuickPick(options,
				{
					title: `Change \'${current?.label}\' formatting to:`,
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
			applyProcessor(getProcessor(newItem.fsContent.format));
		}),

		vscode.commands.registerCommand(FictionWriter.formatting.reformat, async () => {
			const item = stateManager
				.get(vscode.window.activeTextEditor?.document?.uri?.fsPath)?.fwItem;

			// Cannot change for unknown state
			if (item?.fsContent?.format === undefined) return;

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
			applyProcessor(getProcessor(result.value));
		}),

		vscode.languages.registerDocumentFormattingEditProvider('fwmarkdown', {

			provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
				let edits: vscode.TextEdit[] = [];

				const state = stateManager.get(document?.uri?.fsPath);
				if (!state) return edits;

				const markdownContent = document.getText();

				try {
					const result = getProcessor(state.fwItem?.fsContent.format).processSync(markdownContent).toString();

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

