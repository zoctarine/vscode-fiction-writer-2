import {DisposeManager, IDisposable} from '../disposable';
import vscode from 'vscode';
import {ChainedTextProcessor, ITextProcessor} from '../../processors';
import deepEqual from 'deep-equal';
import rfdc from 'rfdc';
import {IFileState, IFileStateSnapshot} from '../../processors/states';
import {DynamicObj} from '../types';
import {ProjectFileState} from './stateManager';

const clone = rfdc();

export enum StateChangeAction {
    None = "none",
    Changed = 'changed',
    Deleted = 'delete',
}

export class FwFileStateChangedEvent {
    snapshots = new Map<string, IFileStateSnapshot>();
    state: IFileState = {};
    prevState: IFileState = {};
    changed: (keyof IFileState)[] = [];
    action: StateChangeAction = StateChangeAction.None;
}

export class FwFileState extends DisposeManager {
    private _onDidChange = new vscode.EventEmitter<FwFileStateChangedEvent>();
    private _state: IFileState = {};
    private _snapshots = new Map<string, IFileStateSnapshot>();

    constructor(
        initialState: any,
        private _processor: ITextProcessor<IFileState>,
        disposables?: IDisposable[]) {
        super();
        this._state = {...initialState};

        this.manageDisposable(
            this._onDidChange,
            ...(disposables ?? []));
    }

    get onDidChange() {
        return this._onDidChange.event;
    }

    update(content: string) {
        return this._update(async stateProxy => {
            const nextContent = await this._processor.process(content, stateProxy);

            // if (this._onDidChangeContent && nextContent !== content) {
            //     this._onDidChangeContent(content, nextContent);
            // }
        });
    }

    delete() {
        const state = clone(this._state);
        this._onDidChange.fire(
            {
                prevState: state,
                state: {},
                action: StateChangeAction.Deleted,
                changed: Object.keys(this._state) as (keyof IFileState)[],
                snapshots: new Map<string, IFileStateSnapshot>(),
            }
        );
        this._state = {};
        this._snapshots = new Map<string, IFileStateSnapshot>();
    }

    replaceState(state: IFileState) {
        this._state = state;
    }

    getState(): IFileState {
        return clone(this._state);
    }

    getSnapshots(): Map<string, { prevState: IFileState, state: IFileState }> {
        return clone(this._snapshots);
    }

    async _update(actionCallback: (stateProxy: any) => Promise<void>) {
        const dirtyProperties = new Set<string | symbol>();
        const prevState = clone(this._state);
        let stateProxy = new Proxy<any>(this._state, {
            set: (target, p, newValue, receiver) => {
                if (!deepEqual(target[p], newValue)) {
                    dirtyProperties.add(p);
                }
                return Reflect.set(target, p, newValue, receiver);
            },
            deleteProperty: (target, p) => {
                dirtyProperties.add(p);
                return Reflect.deleteProperty(target, p);
            }
        });

        try {
            await actionCallback(stateProxy);
        } catch (error) {
            console.log("Cannot React to Stat Update", error);
        }
        stateProxy = undefined;

        if (this._onDidChange && dirtyProperties.size > 0) {
            this._snapshots = (this._processor as ChainedTextProcessor).snapshots;
            this._onDidChange.fire({
                prevState: prevState,
                state: clone(this._state),
                changed: [...dirtyProperties.values()] as (keyof IFileState)[],
                snapshots: clone(this._snapshots),
                action: StateChangeAction.Changed
            });
        }
    }

    dispose() {
        super.dispose();
        this._state = {};
    }
}