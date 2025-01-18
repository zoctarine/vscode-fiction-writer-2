import * as vscode from 'vscode';
import {getNonce} from '../../core';

export class DoNothingEditor implements vscode.CustomTextEditorProvider {

	public static register(): vscode.Disposable {
		const provider = new DoNothingEditor();

		return vscode.window.registerCustomEditorProvider(
			DoNothingEditor.viewType,
			provider, {
				webviewOptions: {
					retainContextWhenHidden: false,
					enableFindWidget: false,
				},
				supportsMultipleEditorsPerDocument: false,
			});
	}

	public static readonly viewType = 'fictionWriter.editors.proseMirror';

	/**
	 * Called when our custom editor is opened.
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		webviewPanel.webview.options = {
			enableScripts: true,
			enableCommandUris: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		const settingsUri = 'command:workbench.action.openSettings?%5B%22fictionWriter.editors.richTextEditor.enabled%22%5D';
		const nonce = getNonce();
		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head >
				<meta charset="UTF-8">
				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Fiction Writer Editor</title>
			</head>
			<body>
				<p>The <b>Fiction Writer Editor</b> is disabled.</p>
				<p>You can enable it in <a href="${settingsUri}">settings</a></p>
			</body>
			</html>`;
	}

}