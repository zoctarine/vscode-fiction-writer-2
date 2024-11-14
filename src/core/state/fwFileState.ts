import vscode from 'vscode';
import deepEqual from 'deep-equal';
import rfdc from 'rfdc';
import {DisposeManager, IDisposable} from '../disposable';
import {IStateProcessor} from '../processors';
import {IFileState} from './states';
import {IStateProcessorFactory} from '../processors/IStateProcessorFactory';
import {log} from '../logging';

const clone = rfdc();

export enum StateChangeAction {
    None = "none",
    Changed = 'changed',
    Deleted = 'delete',
}

export class FwFileStateChangedEvent {
    state: IFileState = {};
    prevState: IFileState = {};
    changed: (keyof IFileState)[] = [];
    action: StateChangeAction = StateChangeAction.None;
}

export class FwFileState extends DisposeManager {
    private _onDidChange = new vscode.EventEmitter<FwFileStateChangedEvent>();
    private _state: IFileState = {};
    private _stateProcessor: IStateProcessor<IFileState>;

    constructor(
        initialState: any,
        processorFactory: IStateProcessorFactory<IFileState>,
        disposables?: IDisposable[]) {

        super();
        this._state = {...initialState};
        this._stateProcessor = processorFactory.crateStateProcessor();
        this.manageDisposable(
            this._onDidChange,
            ...(disposables ?? []));
    }

    get onDidChange() {
        return this._onDidChange.event;
    }

    async loadState(content: string, initialState: IFileState) {
        this._state = initialState;
        await this._process(stateProxy => {
            return this._stateProcessor.process(stateProxy);
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
            }
        );
        this._state = {};
    }

    getState(): IFileState {
        return clone(this._state);
    }


    async _process(actionCallback: (stateProxy: any) => Promise<any>) {
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
            this._onDidChange.fire({
                prevState: prevState,
                state: clone(this._state),
                changed: [...dirtyProperties.values()] as (keyof IFileState)[],
                action: StateChangeAction.Changed
            });
        }
    }

    dispose() {
        super.dispose();
        this._state = {};
    }
}