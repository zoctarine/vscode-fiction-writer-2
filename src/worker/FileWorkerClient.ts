import {Worker} from 'worker_threads';
import vscode from 'vscode';
import {DisposeManager, FwInfo, log} from '../core';
import path from 'path';
import {
    ClientMsgFileChanged,
    ClientMsgRootFoldersChanged,
    ClientMsgStart,
    ClientMsgStop, FileChangeAction,
    IWorkerMessage,
    WorkerMsg,
    WorkerMsgFilesChanged, WorkerMsgFilesReload, WorkerMsgJobFinished, WorkerMsgJobProgress, WorkerMsgJobStarted
} from './models';
import {FwItem} from '../core/fwFiles/FwItem';

export class StatusBarMessage extends DisposeManager {
    private readonly _statusBarItem: vscode.StatusBarItem;

    constructor() {
        super();
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.manageDisposable(
            this._statusBarItem
        );
    }

    public hide() {
        this._statusBarItem.hide();
    }

    public show(message: string, tooltip?: string) {
        this._statusBarItem.text = `$(sync~spin) ${message}`;
        this._statusBarItem.tooltip = `${tooltip}`;
        this._statusBarItem.show();
    }

}

const l = log.for('FileWorkerClient');

export class FileWorkerClient extends DisposeManager {
    w: Worker | undefined;
    private _onFilesChanged = new vscode.EventEmitter<Map<string, FwItem>>();
    private _onFilesReloaded = new vscode.EventEmitter<Map<string, FwItem>>();
    private _onJobStarted = new vscode.EventEmitter<string>();
    private _onJobFinished = new vscode.EventEmitter<string>();

    constructor() {
        super();

        const workerPath = path.join(__dirname, 'worker/worker.js');

        this.w = new Worker(workerPath, {});

        const statusBarMessage = new StatusBarMessage();

        this.w
            .on('message', (message: IWorkerMessage) => {
                l.trace(`worker.on.message`, message.type);

                switch (message.type) {
                    case WorkerMsg.start:
                        vscode.window.showInformationMessage(`Worker started`);
                        break;

                    case WorkerMsg.filesChanged:
                        const cMsg = message as WorkerMsgFilesChanged;
                        this._onFilesChanged.fire(cMsg.fwFiles);
                        break;

                    case WorkerMsg.filesReload:
                        const rMsg = message as WorkerMsgFilesReload;
                        this._onFilesReloaded.fire(rMsg.fwFiles);
                        break;

                    case WorkerMsg.jobStarted:
                        this._onJobStarted.fire((message as WorkerMsgJobStarted).msg);
                        break;

                    case WorkerMsg.jobProgress:
                        const msg = message as WorkerMsgJobProgress;
                        statusBarMessage.show(`$(sync~spin) Indexing Fiction ${msg.current}/${msg.total}`);
                        break;

                    case WorkerMsg.jobFinished:
                        this._onJobFinished.fire((message as WorkerMsgJobFinished).msg);
                        statusBarMessage.hide();
                        break;
                }
            })
            .on('error', (error) => {
                vscode.window.showErrorMessage(`Worker error: ${error.message}`);
            })
            .on('exit', (code) => {
                if (code !== 0) {
                    vscode.window.showErrorMessage(`Worker stopped with exit code ${code}`);
                }
            });

        this.manageDisposable(
            statusBarMessage,
            this._onFilesChanged,
            this._onFilesReloaded,
            this._onJobFinished,
            this._onJobStarted);

        this.w.postMessage(new ClientMsgStart());
    }

    public get onFilesChanged() {
        return this._onFilesChanged.event;
    }

    public get onFilesReloaded() {
        return this._onFilesReloaded.event;
    }

    public get onJobStarted() {
        return this._onJobStarted.event;
    }

    public get onJobFinished() {
        return this._onJobFinished.event;
    }

    sendWorkspaceFilesChanged(paths: string[]) {
        this._post(new ClientMsgRootFoldersChanged(paths));
    }

    sendFileChanged(path: string, action: FileChangeAction) {
        this._post(new ClientMsgFileChanged(path, action));
    }

    private _post(msg: any){
        l.trace("worker.post.message", msg);
        this.w?.postMessage(msg);
    }

    stopWorker() {
        if (this.w) {
            this.w.postMessage(new ClientMsgStop());
            this.w.terminate();
            this.w = undefined;
        }

        this.dispose();
    }
}