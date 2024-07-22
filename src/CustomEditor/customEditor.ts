import * as vscode from 'vscode';

import { EditorState, Transaction } from "prosemirror-state";
import { Step } from "prosemirror-transform";
import { schema, defaultMarkdownParser, customMarkdownSerializer } from "./fictionWriterMarkdown";
import { exampleSetup } from "prosemirror-example-setup";

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};


/**
 * Provider for cat scratch editors.
 * 
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 * 
 * This provider demonstrates:
 * 
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */

export class ProseMirrorEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new ProseMirrorEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(
			ProseMirrorEditorProvider.viewType,
			provider, {
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		});
		return providerRegistration;
	}

	private static readonly viewType = 'fictionWriter2.proseMirrorEditor';


	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Called when our custom editor is opened.
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		let editorState: EditorState = new EditorState();
		let subscriptions: vscode.Disposable[] = [];

		webviewPanel.webview.options = { enableScripts: true, };
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		webviewPanel.onDidChangeViewState((e) => {
			if (!e.webviewPanel.active){
				this.updateTextDocument(document, editorState);
			}
		});

		editorState = EditorState.create({
			doc: defaultMarkdownParser.parse(document.getText()),
			plugins: exampleSetup({ schema: schema }),
		}
		);

		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		subscriptions.push(vscode.workspace.onWillSaveTextDocument(e => {
			if (document.uri.toString() !== document.uri.toString()) { return; }
			console.log('onWillSaveTextDocument');
			this.updateTextDocument(document, editorState);
		}));

		subscriptions.push(vscode.workspace.onDidSaveTextDocument(e => {
			if (document.uri.toString() !== document.uri.toString()) { return; }
			console.log('onDidSaveTextDocument');
			updateWebview();
		}));

		subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() !== document.uri.toString()) { return; }
			console.log('onDidChangeTextDocument');

			if (!webviewPanel.active){
				updateWebview();
			}
		}));

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			subscriptions.forEach((s) => s.dispose());
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.command) {
				case 'update':
					try {
						console.log('Received update content');
						
						var transaction = editorState.tr;
						for (let i = 0; i < e.text.length; i++) {						
							transaction.step(Step.fromJSON(schema, e.text[i]));
						};

						editorState = editorState.apply(transaction);
						if (!document.isDirty) {
							this.updateTextDocument(document, editorState);
						}
						return;

					} catch (err) {
						console.log(err);
					}
			}
		});

		updateWebview();
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'view.js'));
			
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'editor.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleMainUri}" rel="stylesheet" />
				<title>Fiction Writer Editor</title>
			</head>
			<body>
				<div id="editor"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}


	/**
	 * Write out the json to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, editorState: EditorState) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			customMarkdownSerializer.serialize(editorState.doc));

		return vscode.workspace.applyEdit(edit);
	}
}