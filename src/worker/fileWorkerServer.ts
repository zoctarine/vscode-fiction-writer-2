import {MessagePort} from 'node:worker_threads';
import {
    ClientMsgFileChanged,
    ClientMsgRootFoldersChanged,
    ClientMsgStart,
    WorkerMsgFilesChanged,
    WorkerMsgStart
} from './models';
import vscode from 'vscode';

export class FileWorkerServer {
    constructor(private _parentPort: MessagePort | null) {

    }

    private _changes = new Map<string, string>();
    private _changeTimeout: NodeJS.Timeout | undefined;

    private _handleEvent(path: string, action: string){
        if (this._changeTimeout) {
            clearTimeout(this._changeTimeout);
        }
        this._changes.set(path, action);

        this._changeTimeout = setTimeout(()=>this._processFileChanges(), 300);
    }

    private async _processFileChanges(){
        const changes = [...this._changes.entries()];
        this._changes.clear();
        if (changes.length === 0) return;
        this.post(new WorkerMsgFilesChanged(changes.map(f => f[0])));
    }

    start(e: ClientMsgStart) {
        const evt = new WorkerMsgStart();
        this.post(evt);
    }

    rootFoldersChanged(e: ClientMsgRootFoldersChanged) {
        const evt = new WorkerMsgFilesChanged([]);
        evt.paths = ['root folder changed'];
        this.post(evt);
    }

    filesChanged(e: ClientMsgFileChanged) {
        this._handleEvent(e.path, e.action);
    }

    post(msg: any) {
        this._parentPort?.postMessage(msg);
    }
}