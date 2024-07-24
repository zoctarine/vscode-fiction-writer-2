import * as vscode from 'vscode';
import { processInputFile } from "../../../processors";
import { getNonce } from '../../../common/nonce';



export class CodeMirrorEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new CodeMirrorEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(
			CodeMirrorEditorProvider.viewType,
			provider, {
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		});
		return providerRegistration;
	}

	private static readonly viewType = 'fictionWriter2.codeMirrorEditor';


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
		let subscriptions: vscode.Disposable[] = [];
		let lastVersion = document.version;

		webviewPanel.webview.options = { enableScripts: true, };
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		webviewPanel.onDidChangeViewState((e) => {
			// When user switches out of the editor, we sync the unsaved changes
			// to the document, so they can be persisted on the next save. 
			if (!e.webviewPanel.active) {
				//this.updateTextDocument(document, editorState);
			}
		});



		function updateWebview() {
			const text = processInputFile(document.getText());
			// editorState = EditorState.create({
			// 	doc: fileParser.parse(text),
			// 	plugins: exampleSetup({ schema: schema }),
			// });

			webviewPanel.webview.postMessage({
				type: 'update',
				text: text,
			});
		}

		subscriptions.push(vscode.workspace.onWillSaveTextDocument(e => {
			if (document.uri.toString() !== document.uri.toString()) { return; }
			console.log('onWillSaveTextDocument:');

			if (document.version === lastVersion) {
			//	this.updateTextDocument(document, editorState);
			}
		}));

		subscriptions.push(vscode.workspace.onDidSaveTextDocument(e => {
			if (document.uri.toString() !== document.uri.toString()) { return; }
			console.log('onDidSaveTextDocument');
			updateWebview();
		}));

		subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() !== document.uri.toString()) { return; }
			console.log('onDidChangeTextDocument');

			// Only update the webview if the document is view is not active. 
			// The change might come from the active editor, so we don't want to enter
			// an infinite loop of updating the webview and applying the change.
			//
			// TODO(?): If the view is active, but the change is not from the webview,
			// 		 we should show a prompt to ask the user to reload the document.
			if (!webviewPanel.active) {
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

						// var transaction = editorState.tr;
						// for (let i = 0; i < e.text.length; i++) {
						// 	transaction.step(Step.fromJSON(schema, e.text[i]));
						// };

						// editorState = editorState.apply(transaction);

						// // This is a time consumig operation, so we can't run it on each
						// // small change. We only update the document once, if it's not dirty, 
						// // to make sure sure that the default vscode save prompt is triggered on close. 
						// // TODO: find a differet way to mark document as dirty?
						// //
						// // The actual document sync happends on willSaveTextDocument.

						// if (!document.isDirty) {
						// 	this.updateTextDocument(document, editorState);
						// }

						lastVersion = document.version;
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
			this.context.extensionUri, 'media', 'codeMirrorClient.js'));

		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'codeMirrorEditor.css'));

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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src 'self' 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
}