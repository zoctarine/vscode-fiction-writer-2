import vscode from 'vscode';
import {log} from '../logging';

interface IReplacement {
	match?: RegExp,
	replace: string,
	maxColumn?: number,
}

export function registerAutoReplace(): vscode.Disposable {
	const triggers = [' '];
	const atBeginningOfLine = /^\s*$/i;
	const replacements = new Map<string, [string, RegExp?]>([
		['--', ['—', atBeginningOfLine]],
		['—-', ['—', atBeginningOfLine]]
	]);

	const replacement = [
		{triggerOn: ' ', match: /^(?<before>\s*)(?<toReplace>---?)/, replace: '—', maxColumn: 5},

	].reduce((acc: Map<string, IReplacement[]>, cur: any) => {
		const rep = acc.get(cur.triggerOn) ?? [];
		rep.push({match: cur.match, replace: cur.replace});
		acc.set(cur.triggerOn, rep);
		return acc;
	}, new Map<string, IReplacement[]>());


	const autoreplace = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;

		if (!editor || event.document !== editor.document) {
			return;
		}
		const doc = editor.document;

		// Only handle the main change
		const change = event.contentChanges[0];
		if (!change) return;

		// Only interested in keystrokes
		const typedText = change.text;
		if (typedText.length !== 1) return;


		// try for a trigger;
		const candidates = replacements.get(typedText);
		if (candidates) {

		}
		if (change.rangeLength === 0 && triggers.includes(typedText)) {


			const crtPos = change.range.start;
			const prevPos = doc.positionAt(doc.offsetAt(crtPos) - 2);
			const range = new vscode.Range(prevPos, crtPos);
			if (!range.isSingleLine) return;

			const typedText = doc.getText(range);
			const replacement = replacements.get(typedText);
			if (replacement !== undefined) {
				const [text, condition] = replacement;
				if (condition) {
					// get text types so far on current line
					const lineSoFar = doc.getText(
						new vscode.Range(
							new vscode.Position(prevPos.line, 0),
							prevPos));

					// if line so far does not match condition, don't apply
					if (!lineSoFar.match(condition)) {
						return;
					}
				}

				const edit = new vscode.WorkspaceEdit();
				edit.replace(
					editor.document.uri,
					range,
					text
				);
				vscode.workspace.applyEdit(edit);
			}
		}
	});


	return vscode.Disposable.from(autoreplace);
}