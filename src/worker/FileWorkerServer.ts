import {MessagePort} from 'node:worker_threads';
import {
    ClientMsgFileChanged,
    ClientMsgRootFoldersChanged,
    ClientMsgStart, FileChangeAction,
    WorkerMsgFilesChanged,
    WorkerMsgFilesReload,
    WorkerMsgJobFinished, WorkerMsgJobProgress,
    WorkerMsgJobStarted, WorkerMsgMessage,
    WorkerMsgStart,

} from './models';
import {FwItemBuilder} from '../core/fwFiles/builders/FwItemBuilder';
import {FwInfo, FwPermission, Permissions} from '../core/fwFiles';
import {glob} from 'glob';
import {FwItem} from '../core/fwFiles/FwItem'; // Don't wnt any dependency to vscode

export class FileWorkerServer {
    private _acceptsEvents = true;
    private _fwBuilder = new FwItemBuilder();
    private _files = new Map<string, FwItem>();
    private _lastPostTime: number = new Date(0, 0, 0).getTime();

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

        let onlyContentChanges = true;
        for (const change of changes) {
            if (change[1] !== FileChangeAction.Modified) onlyContentChanges = false;

            if (change[1] === FileChangeAction.Deleted) {
                this._files.delete(change[0]);
            }
            try {
                const item = await this._fwBuilder.buildAsync({fsPath: change[0], rootFolderPaths: this._rootFolders});
                this._files.set(change[0], item);
            } catch (err) {
                this._files.delete(change[0]);
            }
        }

        onlyContentChanges
            ? this.post(new WorkerMsgFilesChanged(changes
                .map(c => this._files.get(c[0]))
                .filter(c => c !== undefined)
            ))
            : this.post(new WorkerMsgFilesReload([...this._files.values()]));
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
        let files = 0;
        this.post(new WorkerMsgJobStarted(""));
        try {
            this._changes.clear();
            if (!this._rootFolders || !this._rootFolders.length) {
                this.post(new WorkerMsgFilesReload([]));
                return;
            }
            this._files = new Map<string, FwItem>();
            for (const fsPath of this._rootFolders) {
                const allPaths = await glob("**",
                    {
                        cwd: fsPath,
                        absolute: true,
                        dot: false,
                        ignore: ['**/.vscode/**', '**/node_modules/**']
                    });
                for (const fsPath of allPaths) {
                    const value = await this._fwBuilder.buildAsync({fsPath, rootFolderPaths: this._rootFolders});
                    if (Permissions.check(value?.info, FwPermission.Read)) {
                        files++;
                    }
                    this._files.set(fsPath, value);
                    this.postWithThrottle(new WorkerMsgJobProgress("", this._files.size, allPaths.length));
                }
                this.post(new WorkerMsgJobProgress("", this._files.size, this._files.size));
                this.post(new WorkerMsgFilesReload([...this._files.values()]));
            }
            return;
        } finally {
            this._acceptsEvents = true;
            this.post(new WorkerMsgJobFinished(`${this._files.size}/${files}`));
        }
    }

    filesChanged(e: ClientMsgFileChanged) {
        this._handleEvent(e.path, e.action);
    }

    post(msg: any) {
        this._parentPort?.postMessage(msg);
    }

    postWithThrottle(msg: any) {
        const now = Date.now();
        const postInterval = 1000;
        const shouldPost = now - this._lastPostTime >= postInterval;
        if (shouldPost) {
            this.post(msg);
            this._lastPostTime = now;
        }
    }

    log(msg: string, severity: number = 10) {
        this.post(new WorkerMsgMessage(msg, severity));
    }
}