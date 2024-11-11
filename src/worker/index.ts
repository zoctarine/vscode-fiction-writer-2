import {Worker} from 'worker_threads';
import path from 'path';
import vscode from 'vscode';
import {
    WorkerMsgFilesChanged,
    IWorkerMessage,
    ClientMsgRootFoldersChanged,
    ClientMsgStart,
    WorkerMsg, ClientMsgFileChanged, ClientMsgStop
} from './models';
import {log} from '../core';


export class FileWorkerClient {
    w: Worker | undefined;
    private _onFilesChanged = new vscode.EventEmitter<string[]>();

    constructor() {
        const workerPath = path.join(__dirname, 'worker/worker.js');

        this.w = new Worker(workerPath, {

        });

        this.w.on('message', (message:IWorkerMessage) => {
            log.debug(`FileWorker event`, message);

            switch (message.type) {
                case WorkerMsg.start:
                    vscode.window.showInformationMessage(`Worker started`);
                    break;

                case WorkerMsg.filesChanged:
                    const msg = message as WorkerMsgFilesChanged;
                    this._onFilesChanged.fire(msg.paths);
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

    public get onFilesChanged() { return this._onFilesChanged.event; }

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
    }
}

