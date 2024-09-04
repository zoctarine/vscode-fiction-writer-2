import vscode, {WorkspaceConfiguration} from 'vscode';
import {Options} from './options';
import {log} from '../logging';
import deepEqual from 'deep-equal';

/**
 * Generic class to hold a value that can be changed by the user.
 * It can also be listened for changes by subscribing to the `onChanged` event.
 */
export class OptionValue<T> {
    private _value: T;
    private readonly _defaultValue: T;
    private readonly _name: string;
    private readonly _onDidChange = new vscode.EventEmitter<T>();
    private readonly _onValue = new vscode.EventEmitter<T>();
    private readonly _container: Options;
    private _target: vscode.ConfigurationTarget;

    constructor(name: string, defaultValue: T, container: Options, target = vscode.ConfigurationTarget.Global) {
        this._defaultValue = defaultValue;
        this._value = defaultValue;
        this._name = name;
        this._container = container;
        this._target = target;
    }

    get value(): T {
        return this._value;
    }

    update(value: T) {
        return this._container.update(this._name, value, this._target);
    }

    /**
     * Event fired when the value of the option changes.
     * If the new value is the same as the old value, the event is not fired.
     */
    get onChanged() {
        return this._onDidChange.event;
    }

    /**
     * Event fired when the value of the option is read from configuration.
     * This event is always fired, even if the value is the same as the old value.
     */
    get onValue() {
        return this._onValue.event;
    }

    /**
     * Get the current value of the option, and fires the `onChanged` event only if the value changed.
     */
    public refresh(section: WorkspaceConfiguration, silent: boolean = false) {
        const newValue = section.get<T>(this._name, this._defaultValue);
        this._onValue.fire(newValue);
        if (!deepEqual(this.value, newValue)) {
            log.debug(`Configuration '${this._container.section}.${this._name}' changed to`, newValue);
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