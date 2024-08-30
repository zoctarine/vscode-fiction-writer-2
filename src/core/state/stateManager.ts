import {DisposeManager} from '../disposable';
import vscode from 'vscode';
import {ITextProcessor} from '../../processors';
import {FwFileInfo} from '../fwFileInfo';

import {FwFileState, FwFileStateChangedEvent} from './fwFileState';
import {IFileState, IFileStateSnapshot} from '../../processors/states';

export class FwStateChangedEvent {
    files: FwFileStateChangedEvent[] = [];
    changed: (keyof IFileState)[] = [];
}

export class ProjectFileState {
    public state!: FwFileState;
    public fileInfo!: FwFileInfo;

    dispose() {
        this.state.delete();
        this.state.dispose();
    }
}

export class StateManager extends DisposeManager {
    private _fileStates = new Map<string, ProjectFileState>();
    private _eventQueue: FwFileStateChangedEvent[] = [];
    private _enqueue = false;
    private _onFilesChanged = new vscode.EventEmitter<FwStateChangedEvent>();

    constructor(private _textProcessor: ITextProcessor<IFileState>) {
        super();
    }

    initialize(files: FwFileInfo[]) {
        this._unTrackAll();

        for (const info of files) {
            this.track(info);
        }
    }

    public track(fileInfo: FwFileInfo): ProjectFileState {
        // if we previously tracked this item, dispose of it first
        this.unTrack(fileInfo.fsPath);

        const file = new ProjectFileState();
        file.state = new FwFileState({fileInfo}, this._textProcessor);
        this.manageDisposable(file.state.onDidChange((event) => {
            this._handleOnFileChanged(event);
        }));
        file.fileInfo = fileInfo;
        this._fileStates.set(fileInfo.fsPath, file);
        return file;
    }

    private unTrack(key: string) {
        try {
            const item = this._fileStates.get(key);

            if (item) {
                this._fileStates.delete(key);
                item.dispose();
            }
        } finally {
        }
    }

    refresh() {
        return this.reload([...this._fileStates.values()].map(s => s.fileInfo));
    }

    async reload(files: FwFileInfo[]) {
        this._enqueueOn();
        for (const file of files) {
            try {
                let item = this._fileStates.get(file.fsPath);
                const path = vscode.Uri.parse(file.fsPath);
                let stat: vscode.FileStat | undefined;

                try {
                    stat = await vscode.workspace.fs.stat(path);
                } catch {
                    stat = undefined;
                }

                // If file exists
                if (stat) {
                    if (stat.type === vscode.FileType.File) {
                        const rawBytes = await vscode.workspace.fs.readFile(path);
                        const content = rawBytes ? new TextDecoder().decode(rawBytes) : "";
                        // If we did not track item
                        if (!item) {
                            item = this.track(file);
                        }
                        item.state.replaceState({fileInfo: item.fileInfo});
                        await item.state.update(content);
                    }
                    // If the file does not exist
                } else {
                    // If we tracked it, we delete it
                    if (item) {
                        this.unTrack(file.fsPath);
                    }
                }
            } catch (error) {
                console.warn("Cannot load file: " + file.fsPath, error);
            }
        }
        this._enqueueOff();
    }

    get onFilesChanged() {
        return this._onFilesChanged.event;
    }

    private _handleOnFileChanged(event: FwFileStateChangedEvent) {
        if (this._enqueue) {
            this._eventQueue.push(event);
        } else {
            this._fire([event]);
        }
    }

    private _fire(fileEvents: FwFileStateChangedEvent[]) {
        const allChanges = fileEvents.reduce((acc, val) => acc.concat(val.changed), [] as (keyof IFileState)[]);

        const event = new FwStateChangedEvent();
        event.files = fileEvents;
        event.changed = [...new Set(allChanges)];

        this._onFilesChanged.fire(event);
    }

    private _enqueueOn() {
        this._enqueue = true;
    }

    private _enqueueOff() {
        this._enqueue = false;
        this._fire([...this._eventQueue]);
        this._eventQueue = [];
    }

    private _unTrackAll() {
        for (const [key, value] of this._fileStates.entries()) {
            this.unTrack(key);
        }
    }

    get trackedFiles() {
        return [...this._fileStates.values()].map(s => s.state?.getState());
    }

    get(fsPath: string): IFileState | undefined {
        const item = this._fileStates.get(fsPath);
        if (item) {
            return {...item.state.getState()};
        }
        return undefined;
    }

    getWithSnapshots(fsPath: string): { state?: IFileState, snapshots?: Map<string, IFileStateSnapshot> } {
        const item = this._fileStates.get(fsPath);
        return {
            state: item?.state.getState(),
            snapshots: item?.state.getSnapshots()
        };
    }


    dispose() {
        super.dispose();
        this._unTrackAll();
    }
}