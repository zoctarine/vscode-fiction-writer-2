import {MessagePort} from 'node:worker_threads';
import {
    ClientMsgFileChanged,
    ClientMsgRootFoldersChanged,
    ClientMsgStart,
    WorkerMsgFilesChanged, WorkerMsgFilesReload,
    WorkerMsgStart
} from './models';
import {FwFileBuilder} from '../core/fwFiles/builders/FwFileBuilder';
import {FwFile} from '../core';
import {glob} from 'glob'; // Don't wnt any dependency to vscode

export class FileWorkerServer {
    private _acceptsEvents = true;
    private _fwBuilder = new FwFileBuilder();
    private _files = new Map<string, FwFile>();

    constructor(private _parentPort: MessagePort | null) {

    }

    private _rootFolders: string[] = [];

    private _changes = new Map<string, string>();
    private _changeTimeout: NodeJS.Timeout | undefined;

    private _handleEvent(path: string, action: string) {
        if (!this._acceptsEvents) {
            return;
        }
        if (this._changeTimeout) {
            clearTimeout(this._changeTimeout);
        }

        this._changes.set(path, action);

        // TODO: instead of reload all, send only changed items
        this._changeTimeout = setTimeout(() => this._processFileChanges(), 300);
    }

    private async _processFileChanges() {
        const changes = [...this._changes.entries()];
        this._changes.clear();
        if (changes.length === 0) return;

        let hasStructureChanges = false;
        for (const change of changes) {
            if (change[1] !== 'change') hasStructureChanges = true;

            if (change[1] === 'delete') {
                this._files.delete(change[0]);
            }
            try {
                const item = await this._fwBuilder.buildAsync({fsPath: change[0]});
                this._files.set(change[0], item);
            } catch (err) {
                this._files.delete(change[0]);
            }
        }

        hasStructureChanges
            ? this.post(new WorkerMsgFilesReload([...this._files.values()]))
            : this.post(new WorkerMsgFilesChanged(changes
                .map(c => this._files.get(c[0]))
                .filter(c => c !== undefined)
            ));
    }

    start(e: ClientMsgStart) {
        const evt = new WorkerMsgStart();
        this.post(evt);
    }

    async rootFoldersChanged(e: ClientMsgRootFoldersChanged) {
        this._stop();
        this._rootFolders = e.paths;
        await this._reloadAll();
    }

    private _stop() {
        if (this._changeTimeout) {
            clearTimeout(this._changeTimeout);
        }
    }

    async _reloadAll() {
        this._acceptsEvents = false;
        try {
            this._changes.clear();
            if (!this._rootFolders || !this._rootFolders.length) {
                this.post(new WorkerMsgFilesReload([]));
                return;
            }
            this._files = new Map<string, FwFile>();
            for (const fsPath of this._rootFolders) {
                const allPaths = await glob("**",
                    {
                        cwd: fsPath,
                        absolute: true,
                        dot: false,
                        ignore: ['**/.vscode/**']
                    });
                for (const fsPath of allPaths) {
                    const value = await this._fwBuilder.buildAsync({fsPath});
                    this._files.set(fsPath, value);
                }

                this.post(new WorkerMsgFilesReload([...this._files.values()]));
            }
            return;
        } finally {
            this._acceptsEvents = true;
        }
    }

    filesChanged(e: ClientMsgFileChanged) {
        this._handleEvent(e.path, e.action);
    }

    post(msg: any) {
        this._parentPort?.postMessage(msg);
    }
}