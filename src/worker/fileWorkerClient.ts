import {Worker} from 'worker_threads';
import vscode from 'vscode';
import {FwFile, log} from '../core';
import path from 'path';
import {
    ClientMsgFileChanged,
    ClientMsgRootFoldersChanged,
    ClientMsgStart,
    ClientMsgStop,
    IWorkerMessage,
    WorkerMsg,
    WorkerMsgFilesChanged, WorkerMsgFilesReload
} from './models';

export class FileWorkerClient {
    w: Worker | undefined;
    private _onFilesChanged = new vscode.EventEmitter<FwFile[]>();
    private _onFilesReloaded = new vscode.EventEmitter<FwFile[]>();

    constructor() {
        const workerPath = path.join(__dirname, 'worker/worker.js');

        this.w = new Worker(workerPath, {});

        this.w.on('message', (message: IWorkerMessage) => {
            log.debug(`FileWorker event`, message.type);

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
            }
        });

        this.w.on('error', (error) => {
            vscode.window.showErrorMessage(`Worker error: ${error.message}`);
        });

        this.w.on('exit', (code) => {
            if (code !== 0) {
                vscode.window.showErrorMessage(`Worker stopped with exit code ${code}`);
            }
        });

        this.w.postMessage(new ClientMsgStart());
    }

    public get onFilesChanged() {
        return this._onFilesChanged.event;
    }
  public get onFilesReloaded() {
        return this._onFilesReloaded.event;
    }

    sendWorkspaceFilesChanged(paths: string[]) {
        this.w?.postMessage(new ClientMsgRootFoldersChanged(paths));
    }

    sendFileChanged(path: string, action: string) {
        this.w?.postMessage(new ClientMsgFileChanged(path, action));
    }

    stopWorker() {
        if (this.w) {
            this.w.postMessage(new ClientMsgStop());
            this.w.terminate();
            this.w = undefined;
        }

        this._onFilesChanged.dispose();
        this._onFilesReloaded.dispose();
    }
}