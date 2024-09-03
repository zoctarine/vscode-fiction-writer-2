import {DisposeManager} from '../disposable';
import vscode from 'vscode';
import {ITextProcessor} from '../processors';
import {FwFileInfo} from '../fwFiles/fwFileInfo';

import {FwFileState, FwFileStateChangedEvent} from './fwFileState';
import {IFileState, IFileStateSnapshot} from './states';

import {IStateProcessorFactory} from '../processors/IStateProcessorFactory';

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
    private _onFilesStateChanged = new vscode.EventEmitter<FwStateChangedEvent>();
    private _textProcessor;

    constructor(private _processorFactory: IStateProcessorFactory<IFileState>) {
        super();
        this._textProcessor = _processorFactory.createTextProcessor();
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
        file.state = new FwFileState({fileInfo}, this._processorFactory);
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
                        await item.state.loadState(content, {fileInfo: item.fileInfo});
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

    async updateFile(fsPath: string, contentProcessor: (stateProcessorFactory: IStateProcessorFactory<IFileState>) => ITextProcessor<IFileState>) {
        this._enqueueOn();
        try {
            const item = this._fileStates.get(fsPath);
            if (item?.state) {
                const path = vscode.Uri.parse(fsPath);
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
                        const newContent = await contentProcessor(this._processorFactory)
                            .process(content, item);

                        if (newContent !== content) {
                            await vscode.workspace.fs.writeFile(path, new TextEncoder().encode(newContent));
                        }
                        console.log("Written to: ", path, newContent);
                    }
                }
            }
        } catch (error) {
            console.warn("Cannot update file: ", error);
        }
        this._enqueueOff();
    }

    get onFilesStateChanged() {
        return this._onFilesStateChanged.event;
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

        this._onFilesStateChanged.fire(event);
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