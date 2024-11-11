import {DisposeManager} from '../disposable';
import vscode, {WorkspaceEdit} from 'vscode';
import {ITextProcessor} from '../processors';
import {FwItem} from '../fwFiles/fwItem';

import {FwFileState, FwFileStateChangedEvent, StateChangeAction} from './fwFileState';
import {IFileState} from './states';

import {IStateProcessorFactory} from '../processors/IStateProcessorFactory';
import {log} from '../logging';
import {FwPermission, Permissions} from '../fwFiles/fwPermission';
import {asPosix} from '../fwFiles';

export class FwStateChangedEvent {
    files: FwFileStateChangedEvent[] = [];
    changed: (keyof IFileState)[] = [];
}

export class ProjectFileState {
    public state!: FwFileState;
    public fwItem!: FwItem;

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

    initialize(files: FwItem[]) {
        this._unTrackAll();

        for (const info of files) {
            this.track(info);
        }
    }

    public track(fwItem: FwItem): ProjectFileState {
        // if we previously tracked this item, dispose of it first
        this.unTrack(fwItem.ref.fsPath);

        const projState = new ProjectFileState();
        projState.state = new FwFileState({fwItem: fwItem}, this._processorFactory);
        this.manageDisposable(projState.state.onDidChange((event) => {
            this._handleOnFileChanged(event);
        }));
        projState.fwItem = fwItem;
        this._fileStates.set(fwItem.ref.fsPath, projState);
        return projState;
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
        return this.reload([...this._fileStates.values()].map(s => s.fwItem));
    }

    forget(fsPaths: string[]) {
        fsPaths.map(f => asPosix(f))
            .forEach((f, i) => {
                this.unTrack(f);
            });
        this._onFilesStateChanged.fire({
            changed: ['fwItem'],
            files: fsPaths
                .map(f => asPosix(f))
                .map(f => ({
                    state: {},
                    prevState: {},
                    changed: ['fwItem'],
                    action: StateChangeAction.Deleted
                }))
        });
    }

    async reload(fileInfos: FwItem[]) {
        this._enqueueOn();
        this._fileStates.clear(); // TODO: fix this to detect changes in a more efficient way
        for (const item of fileInfos) {
            try {
                if (item.ref.fsExists) {
                    let content = '';
                    if (Permissions.check(item, FwPermission.Read)) {
                        const rawBytes = await vscode.workspace.fs.readFile(vscode.Uri.parse(item.ref.fsPath));
                        content = rawBytes ? new TextDecoder().decode(rawBytes) : "";
                    }
                    let fileState = this._fileStates.get(item.ref.fsPath);
                    // If we did not track item
                    if (!fileState) {
                        fileState = this.track(item);
                    }
                    // we do refresh
                    await fileState.state.loadState(content, {fwItem: item});

                    // If the file does not exist
                } else {
                    // If we tracked it, we delete it
                    if (item) {
                        this.unTrack(item.ref.fsPath);
                    }
                }
            } catch (error) {
                console.warn("Cannot load file: " + item.ref.fsPath, error);
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
                    // TODO: move to fwfilemamnager
                    if (stat.type === vscode.FileType.File) {
                        const doc = await vscode.workspace.openTextDocument(path);
                        const content = doc.getText();
                        const newContent = await contentProcessor(this._processorFactory)
                            .process(content, item);

                        if (newContent !== content) {
                            const edit = new WorkspaceEdit();
                            edit.replace(
                                doc.uri,
                                new vscode.Range(0, 0, doc.lineCount, 0),
                                newContent);
                            vscode.workspace.applyEdit(edit)
                                .then(() => doc.save().then(status => {

                                    log.debug("Updating file content: ", {
                                        status,
                                        path: path.fsPath
                                    });
                                }));
                        }
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

    dispose() {
        super.dispose();
        this._unTrackAll();
    }

    /**
     * Processes states that are not managed by this state manager.
     * This method handles independent states that are outside the regular tracking scope.
     */
    processUnmanaged(content: string, data: IFileState): Promise<string> {
        return this._textProcessor.process(content, data);
    }
}