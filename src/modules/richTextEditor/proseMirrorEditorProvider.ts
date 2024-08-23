import * as vscode from 'vscode';
import * as crypto from 'crypto';

import {EditorState} from "prosemirror-state";
import {Step} from "prosemirror-transform";
import {fileParser, fileSerializer, schema} from "./utils/fileExtensions";
import {exampleSetup} from "prosemirror-example-setup";
import {InputFileProcessor, processInputFile} from "../../processors";
import {getNonce, getWebviewRootUri} from '../../core/nonce';
import {StateManager} from '../../core/stateManager';
import {DisposeManager} from '../../core';
import {RtEditorOptions} from './rtEditorOptions';
import path from 'path';


export class ProseMirrorEditorProvider extends DisposeManager
    implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext,
                           stateManager: StateManager,
                           options: RtEditorOptions): vscode.Disposable {
        const provider = new ProseMirrorEditorProvider(context, stateManager, options);

        return vscode.Disposable.from(
            vscode.window.registerCustomEditorProvider(
                ProseMirrorEditorProvider.viewType,
                provider, {
                    webviewOptions: {
                        retainContextWhenHidden: false,
                        enableFindWidget: true,
                    },
                }),
            provider);
    }

    public static readonly viewType = 'fictionWriter.editors.proseMirror';

    private _webviewOptions: {} = {};

    constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _stateManager: StateManager,
        private readonly _options: RtEditorOptions
    ) {
        super();
    }

    /**
     * Called when our custom editor is opened.
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        if (_token.isCancellationRequested) return;
        let isDisposed = false;
        let editorState: EditorState = new EditorState();
        let subscriptions: vscode.Disposable[] = [];
        let lastVersion = document.version;
        let metadataBlock = new InputFileProcessor(document.getText()).metadataBlock;
        let showMergeEditor = this._options.showMergeEditor.value;
        let tmpStorageLocation = this._context.storageUri;

        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [getWebviewRootUri(this._context)]
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        function updateWebview(options?: {}) {
            if (isDisposed) return;
            if (!webviewPanel || !webviewPanel.active) return;

            const text = processInputFile(document.getText());
            editorState = EditorState.create({
                doc: fileParser.parse(text),
                plugins: exampleSetup({schema: schema}),
            });

            webviewPanel.webview.postMessage({
                type: 'update',
                text,
                options
            });
        }

        function updateWebviewOptions(options: {}) {
            if (isDisposed) return;
            if (!webviewPanel || !webviewPanel.active) return;
            webviewPanel.webview.postMessage({
                type: 'update',
                options
            });
        }

        function getTmpFile(document: vscode.TextDocument): vscode.Uri {
            // const filename = path.posix.parse(document.fileName).name;
            // const hsh =  crypto.createHash('sha256').update(filename).digest('hex');

            const tmpUri =
                // tmpStorageLocation
                // ? path.posix.join(
                //     tmpStorageLocation.fsPath, filename + hsh + ".tmp")
                // :
                    document.uri.fsPath + ".tmp";

            return vscode.Uri.parse(tmpUri);
        }

        subscriptions.push(this._options.focusMode.onChanged((value) => {
            updateWebviewOptions(this.getWebViewOptions());
        }));

        webviewPanel.onDidChangeViewState((e) => {
            // When user switches out of the editor, we sync the unsaved changes
            // to the document, so they can be persisted on the next save.
            if (!e.webviewPanel.active) {
                this.updateTextDocument(document, metadataBlock, editorState);
            }

            if (e.webviewPanel.active) {
                this._stateManager.activeTextDocument = document;
                updateWebview(this.getWebViewOptions());
            } else {
                //  this._stateManager.activeTextDocument = undefined;
            }
        }, subscriptions);


        vscode.workspace.onWillSaveTextDocument(e => {
            if (isDisposed) return;
            if (!webviewPanel.visible) return;
            if (!webviewPanel.active) return;

            if (document.uri.toString() !== document.uri.toString()) {
                return;
            }

            if (document.version === lastVersion) {
                this.updateTextDocument(document, metadataBlock, editorState);
            }
        }, subscriptions);

        vscode.workspace.onDidSaveTextDocument(e => {
            if (!webviewPanel.visible) return;
            if (document.uri.toString() !== document.uri.toString()) {
                return;
            }
            updateWebview(this.getWebViewOptions());

        }, subscriptions);

        vscode.workspace.onDidChangeTextDocument(e => {
            if (isDisposed) return;
            if (!webviewPanel || !webviewPanel?.webview) return;

            if (e.document.uri.toString() !== document.uri.toString()) {
                return;
            }
            // Only update the webview if the document is view is not active.
            // The change might come from the active editor, so we don't want to enter
            // an infinite loop of updating the webview and applying the change.
            //
            // TODO(?): If the view is active, but the change is not from the webview,
            // 		 we should show a prompt to ask the user to reload the document.
        }, subscriptions);

        // Receive message from the webview.
        webviewPanel.webview.onDidReceiveMessage(e => {
            switch (e.command) {
                case 'update':
                    try {
                        var transaction = editorState.tr;
                        for (let i = 0; i < e.text.length; i++) {
                            transaction.step(Step.fromJSON(schema, e.text[i]));
                        }
                        ;

                        editorState = editorState.apply(transaction);

                        // This is a time consuming operation, so we can't run it on each
                        // small change. We only update the document once, if it's not dirty,
                        // to make sure sure that the default vscode save prompt is triggered on close.
                        // TODO: find a differet way to mark document as dirty?
                        //
                        // The actual document sync happends on willSaveTextDocument.

                        if (!document.isDirty) {
                            this.updateTextDocument(document, metadataBlock, editorState);
                        }

                        lastVersion = document.version;
                        return;

                    } catch (err) {
                        console.log(err);
                    }
            }
        }, subscriptions);

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            console.log("proseMirror.webView disposed");
            isDisposed = true;
            while (subscriptions.length) {
                const disposable = subscriptions.pop();
                if (disposable) {
                    try {
                        disposable.dispose();
                    } catch (e) {
                        console.warn(e);
                    }
                }
            }

            if (showMergeEditor) {
                const tmpFile = getTmpFile(document);
                vscode.workspace.openTextDocument(tmpFile).then(prevContent => {
                    if (prevContent.getText() !== document.getText()) {
                        vscode.commands.executeCommand(
                            'vscode.diff',
                            tmpFile,
                            document.uri,
                            'Previous Version ↔ Modified Version',
                            {
                                preview: true,
                                viewColumn: vscode.ViewColumn.Active
                            }
                        ).then(e => {
                            return vscode.workspace.fs.delete(tmpFile);
                        });
                    } else {
                        return vscode.workspace.fs.delete(tmpFile);
                    }
                });

            }
        });

        if (this._options.showMergeEditor) {
            vscode.workspace.fs.copy(document.uri, getTmpFile(document), {overwrite: true});
        }
        updateWebview(this.getWebViewOptions());
    }

    private getWebViewOptions() {
        return {
            highlight: {
                highlightType: this._options.focusMode.value,
            }
        };
    }

    /**
     * Get the static html used for the editor webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(getWebviewRootUri(this._context, 'proseMirrorClient.js'));
        const styleMainUri = webview.asWebviewUri(getWebviewRootUri(this._context, 'proseMirrorClient.css'));

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
				<div id="toolbar"></div>
				<div id="editor"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }


    private updateTextDocument(document: vscode.TextDocument, metadataBlock: string, editorState: EditorState) {
        const edit = new vscode.WorkspaceEdit();

        // Just replace the entire document.
        // For long documents, this might not be the most efficient, so use it only
        // when necessary.
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            metadataBlock + fileSerializer.serialize(editorState.doc));

        return vscode.workspace.applyEdit(edit);
    }


}