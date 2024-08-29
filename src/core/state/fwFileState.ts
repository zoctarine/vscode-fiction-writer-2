import {DisposeManager, IDisposable} from '../disposable';
import vscode from 'vscode';
import {ITextProcessor} from '../../processors';
import deepEqual from 'deep-equal';
import {IFileState} from '../../processors/states';

export class FwFileStateChangedEvent {
    state: IFileState = {};
    changed: (string | symbol)[] = [];
}

export class FwFileState extends DisposeManager {
    private _onDidChangedState = new vscode.EventEmitter<FwFileStateChangedEvent>();
    private _state: IFileState = {};

    constructor(
        initialState: any,
        private _processor: ITextProcessor,
        disposables?: IDisposable[]) {
        super();
        this._state = {...initialState};

        this.manageDisposable(
            this._onDidChangedState,
            ...(disposables ?? []));
    }

    get onDidChangeState() {
        return this._onDidChangedState.event;
    }

    update(content: string) {
        return this._update(async stateProxy => {
            const nextContent = await this._processor.process(content, stateProxy);

            // if (this._onDidChangeContent && nextContent !== content) {
            //     this._onDidChangeContent(content, nextContent);
            // }
        });
    }

    updateState(stateChanges: any) {
        return this._update(async stateProxy => {
            Object.assign(stateProxy, stateChanges);

            // if (this._onDidChangeContent && nextContent !== content) {
            //     this._onDidChangeContent(content, nextContent);
            // }
        });
    }

    getState(): IFileState {
        return {...this._state};
    }

    setState(state: IFileState) {
        this._state = state;
    }

    async _update(actionCallback: (stateProxy: any) => Promise<void>) {
        const dirtyProperties = new Set<string | symbol>();
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

        if (this._onDidChangedState && dirtyProperties.size > 0) {
            this._onDidChangedState.fire({
                state: {...this._state},
                changed: [...dirtyProperties.values()]
            });
        }
    }

    dispose() {
        super.dispose();
        this._state = {};
    }
}