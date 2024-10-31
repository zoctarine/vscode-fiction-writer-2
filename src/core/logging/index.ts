import {DisposeManager} from '../disposable';
import vscode from 'vscode';
import {MessageOptions} from 'node:child_process';

class Logger extends DisposeManager {
    private _outputChannel: vscode.OutputChannel;
    public enabled: boolean = false;

    constructor() {
        super();

        this._outputChannel = vscode.window.createOutputChannel("FictionWriter", 'log');

        this.manageDisposable(
            this._outputChannel
        );
    }

    debug(text?: string, ...obj: any[]) {
        return this._log("Debug", text, obj);
    }

    info(text?: string, ...obj: any[]) {
        return this._log("Info", text, obj);
    }

    trace(text?: string, ...obj: any[]) {
        return this._log("Trace", text, obj);
    }

    warn(text?: string, ...obj: any[]) {
        return this._log("Warning", text, obj);
    }

    error(text?: string, ...obj: any[]) {
        this._log("Error", text, obj);
    }

    tmp(...obj: any[]) {
        return this._log("-> TEMP", "", obj);
    }

    text(text?: string): Logger {
        if (!this.enabled) return this;
        this._outputChannel.appendLine(text ?? '');
        return this;
    }

    private _format(type: string, message: string) {
        return `[${new Date().toLocaleTimeString()}] ${type}: ${message}`;
    }

    private _log(type: string, text?: string, obj?: any[]) {
        if (!this.enabled) return this;
        this._outputChannel.appendLine("");
        this._outputChannel.append(this._format(type, text ?? ''));
        if (obj !== undefined) {
            obj.forEach((o => this._outputChannel.append(" " + JSON.stringify(o, null, 2))));
        }
        return this;
    }
}

export const log = new Logger();

class UserNotifier {
    info(text: string) {
        vscode.window.showInformationMessage(text);
        log.info("UserMessage", text);
    }

    warn(text: string) {
        vscode.window.showWarningMessage(text);
        log.info("UserMessage", text);
    }
}
export const notifier = new UserNotifier();