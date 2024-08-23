import {addCommand, DisposeManager} from '../../core';
import {SecurityOptions} from './securityOptions';
import vscode from 'vscode';
import {FileEncryptor} from './fileEncryptor';

class SecurityModule extends DisposeManager {
    options = new SecurityOptions();
    fileEncryptor = new FileEncryptor(this.options);

    constructor() {
        super();
    }

    activate(): void {

        this.manageDisposable(
            addCommand('security.encryptCurrentFile',() =>{
                this.fileEncryptor.encryptDocument(vscode.window.activeTextEditor?.document?.uri);
            }),
            addCommand('security.decryptCurrentFile',() =>{
                this.fileEncryptor.decryptDocument(vscode.window.activeTextEditor?.document?.uri);
            }),
        );
    };

    deactivate(): void {
        this.dispose();
    };

    private updateState(enabled: boolean) {
        return enabled
            ? this.activate()
            : this.deactivate();
    }

    register(): vscode.Disposable {
        this.activate();
        return vscode.Disposable.from(this);
    }
}

export const securityModule = new SecurityModule();