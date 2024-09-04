import * as vscode from "vscode";
import {DisposeManager} from "../disposable";
import {OptionValue} from './optionValue';
import {log} from '../logging';

export abstract class Options extends DisposeManager {
    public static readonly RootSectionName = 'fictionWriter';
    public readonly section: string = '';
    private readonly _values: OptionValue<any>[] = [];
    private readonly _onDidChange = new vscode.EventEmitter<void>();

    protected constructor(section: string) {
        super();
        this.section = `${Options.RootSectionName}.${section}`;

        this.manageDisposable(vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(this.section)) {
                    this.refresh();
                }
            }),
            this._onDidChange
        );
    }

    protected valueOf<T>(name: string, defaultValue: T,
                         syncGlobalContext: boolean = false,
                         target = vscode.ConfigurationTarget.Global): OptionValue<T> {
        const option = new OptionValue(name, defaultValue, this, target);
        this._values.push(option);
        if (syncGlobalContext) {
            this.manageDisposable(option.onValue((value) => {
                return vscode.commands.executeCommand("setContext", `${this.section}.${name}`, value);
            }));
        }
        return option;
    }

    public update<T>(name: string, value: T, target: vscode.ConfigurationTarget) {
        const section = vscode.workspace.getConfiguration(this.section);
        log.debug(`Configuration '${this.section}.${name}' set to`, value);

        return section.update(name, value, target).then(
            () => {},
            () => {
                log.error(`Could not set configuration '${this.section}.${name}'`, value);
            });
    }

    public refresh(): Options {
        const section = vscode.workspace.getConfiguration(this.section);
        this._values.forEach(value => value.refresh(section));

        // this._onDidChange.fire();
        return this;
    }

    /**
     * Event fired when any value of the section changes
     */
    get onChanged() {
        return this._onDidChange.event;
    }
}


