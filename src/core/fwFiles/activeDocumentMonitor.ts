import vscode from 'vscode';
import {DisposeManager} from '../disposable';
import {log} from '../logging';
import path from 'path';

export class ActiveDocumentMonitor extends DisposeManager {

    private _activeDocument?: vscode.TextDocument;
    private _onActiveDocumentChanged = new vscode.EventEmitter<vscode.TextDocument | undefined>();

    constructor() {
        super();
        this.activeDocument = vscode.window.activeTextEditor?.document;
        this.manageDisposable(
            this._onActiveDocumentChanged,

            vscode.window.onDidChangeActiveTextEditor(e =>{
                if (e) {
                    this.activeDocument = e?.document;
                }
            })
        );
    }

    set activeDocument(value: vscode.TextDocument | undefined) {
        let fPath = value?.uri.path;
        if (fPath) {
            let base = vscode.workspace.getWorkspaceFolder(value!.uri)?.uri?.fsPath ?? '';
            fPath = path.posix.relative(base, fPath);
        }
        log.debug("ActiveDocumentChanged", fPath);
        this._activeDocument = value;
        this._onActiveDocumentChanged.fire(value);
    }

    get activeDocument() {
        return this._activeDocument;
    }

    get onActiveDocumentChanged(){
        return this._onActiveDocumentChanged.event;
    }

    public dispose(): void {
        super.dispose();
        this._activeDocument = undefined;
    }
}