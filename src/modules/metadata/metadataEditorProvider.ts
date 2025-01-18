import * as vscode from "vscode";
import {getNonce, getWebviewRootUri} from "../../core/nonce";

export class MetadataEditorProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'fictionWriter.views.metadata';
	private _view?: vscode.WebviewView;

	private _disposables: vscode.Disposable[] = [];

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerWebviewViewProvider(
			MetadataEditorProvider.viewType,
			new MetadataEditorProvider(context),
		);
	}

	private constructor(private readonly context: vscode.ExtensionContext) {
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				getWebviewRootUri(this.context),
				vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles'),
				vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webfonts'),
				vscode.Uri.joinPath(this.context.extensionUri, 'media'),
			]
		};

		webviewView.webview.html = this._getWebviewContent(webviewView.webview);
		webviewView.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public dispose() {
		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	private _getWebviewContent(webview: vscode.Webview) {
		const webviewUri = webview.asWebviewUri(getWebviewRootUri(this.context, 'metadataEditorClient.js'));
		const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'styles', 'fontawesome.all.min.css'));
		const nonce = getNonce();
		return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline' ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
          <link href="${cssUri}" rel="stylesheet" />

          <title>Metadata Editor</title>
          <style>
          vscode-data-grid-cell {
            padding: 0;
          }
</style>
        </head>
        <body>
<!--          <i class="fas fa-tags"></i>-->
          <vscode-data-grid id="basic-grid"></vscode-data-grid>
          <br/>
            <vscode-text-area resize="both" rows="5">Summary</vscode-text-area>
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
	}
}