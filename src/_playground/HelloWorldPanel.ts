// file: src/panels/HelloWorldPanel.ts

import * as vscode from "vscode";
import {getNonce, getWebviewRootUri} from "../core/nonce";

export class HelloWorldPanel {
	public static currentPanel: HelloWorldPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel, private readonly context: vscode.ExtensionContext) {
		this._panel = panel;
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._panel.webview.html = this._getWebviewContent(this._panel.webview);
	}

	public static render(context: vscode.ExtensionContext) {
		if (HelloWorldPanel.currentPanel) {
			HelloWorldPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
		} else {
			const panel = vscode.window.createWebviewPanel("hello-world", "Hello World", vscode.ViewColumn.One, {
				// Enable javascript in the webview
				enableScripts: true,
				// Restrict the webview to only load resources from the `out` directory
				localResourceRoots: [getWebviewRootUri(context)]
			});

			HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, context);
		}
	}

	public dispose() {
		HelloWorldPanel.currentPanel = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	private _getWebviewContent(webview: vscode.Webview) {

		const webviewUri = webview.asWebviewUri(getWebviewRootUri(this.context, 'main.js'));
		const nonce = getNonce();
		return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

          <title>Hello World!</title>
        </head>
        <body>
          <h1>Hello World!</h1>
          <vscode-button id="howdy">Howdy!</vscode-button>
         <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
	}
}