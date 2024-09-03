import vscode, {WorkspaceConfiguration} from 'vscode';

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

    constructor(name: string, defaultValue: T) {
        this._defaultValue = defaultValue;
        this._value = defaultValue;
        this._name = name;
    }

    get value(): T {
        return this._value;
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