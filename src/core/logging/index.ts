import {DisposeManager} from '../disposable';
import vscode from 'vscode';

class Logger extends DisposeManager {
    private _outputChannel: vscode.OutputChannel;
    public enabled: boolean = false;

    constructor() {
        super();

        this._outputChannel = vscode.window.createOutputChannel("Fiction Writer Logs", 'log');

        this.manageDisposable(
            this._outputChannel
        );
    }

    debug(text: string, obj?:any): void {
        this._log("Debug", text, obj);
    }
    info(text: string, obj?:any): void {
        this._log("Info", text, obj);
    }
    trace(text: string, obj?:any): void {
        this._log("Trace", text, obj);
    }
    warn(text: string, obj?:any): void {
        this._log("Warning", text, obj);
    }
    error(text: string, obj?:any): void {
        this._log("Error", text, obj);
    }

    text(text: string): void {
        if (!this.enabled) return;
        this._outputChannel.appendLine(text);
    }

    private _format(type: string, message: string){
        return `[${new Date().toLocaleString()}] ${type}: ${message}`;
    }

    private _log(type: string, text: string, obj?:any){
        if (!this.enabled) return;
        this._outputChannel.appendLine("");
        this._outputChannel.append(this._format(type, text));
        if (obj){
            this._outputChannel.append(" " + JSON.stringify(obj));
        }
        this._outputChannel.appendLine("");

    }
}


export const log = new Logger();