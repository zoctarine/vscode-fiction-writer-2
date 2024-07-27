import * as vscode from "vscode";
import {WorkspaceConfiguration} from "vscode";
import {DisposeManager} from "./disposable";

export abstract class Options extends DisposeManager {
    protected section: string = '';
    private readonly _values: OptionValue<any>[] = [];

    protected constructor(section: string) {
        super();
        this.section = section;
        this.refresh(); // Do a refresh before registering the change event,
                        // so we don't trigger the event on the initial load.

        this.manageDisposable(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(this.section)) {
                this.refresh();
            }
        }));
    }

    protected valueOf<T>(name: string, defaultValue: T) {
        const option = new OptionValue(name, defaultValue);
        this._values.push(option);
        return option;
    }

    public refresh(): Options {
        const section = vscode.workspace.getConfiguration(this.section);
        this._values.forEach(value => value.refresh(section));
        return this;
    }

}

/**
 * Generic class to hold a value that can be changed by the user.
 * It can also be listened for changes by subscribing to the `onChanged` event.
 */
export class OptionValue<T> {
    private _value: T;
    private readonly _defaultValue: T;
    private readonly _name: string;
    private readonly _onDidChange = new vscode.EventEmitter<T>();

    constructor(name: string, defaultValue: T) {
        this._defaultValue = defaultValue;
        this._value = defaultValue;
        this._name = name;
    }

    get value(): T {
        return this._value;
    }

    get onChanged() {
        return this._onDidChange.event;
    }

    /**
     * Get the current value of the option, and fires the `onChanged` event only if the value changed.
     */
    public refresh(section: WorkspaceConfiguration) {
        const newValue = section.get<T>(this._name, this._defaultValue);
        if (this.value !== newValue) {
            this._value = newValue;
            this._onDidChange.fire(this._value);
        }
    }

    /**
     * Broadcasts the `onChanged` event with the current value, to all listeners
     */
    public emit() {
        this._onDidChange.fire(this._value);
    }
}


