import * as vscode from 'vscode';
import {Memento, TextDocument} from 'vscode';

export class StateManager {
    private _state: Memento;

    constructor(context: vscode.ExtensionContext) {
        this._state = context.workspaceState;
    }

    set<T>(key: string, value: T): Thenable<void> {
        return this._state.update(key, value);
    }

    get<T>(key: string, defaultValue: T): T {
        return this._state.get(key, defaultValue);
    }

    get activeTextDocument(): TextDocument | undefined {
        return this.get('activeTextDocument', undefined);
    }

    set activeTextDocument(value: TextDocument | undefined) {
        this.set('activeTextDocument', value);
    }

    remove(key: string): Thenable<void> {
        return this._state.update(key, undefined);
    }

    removeMany(prefix: string): Thenable<void[]> {
        return Promise.all(
            this._state.keys()
                .filter(k => k.toUpperCase().startsWith(prefix.toUpperCase()))
                .map(key => this._state.update(key, undefined)));
    }

    clear(): Thenable<void[]> {
        return Promise.all(this._state.keys().map(key => this._state.update(key, undefined)));
    }
}