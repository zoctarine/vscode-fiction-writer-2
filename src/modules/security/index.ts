import {addCommand, DisposeManager, FictionWriter} from '../../core';
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
			addCommand('security.encryptCurrentFile', () => {
				this.fileEncryptor.encryptDocument(vscode.window.activeTextEditor?.document?.uri);
			}),
			addCommand('security.decryptCurrentFile', () => {
				this.fileEncryptor.decryptDocument(vscode.window.activeTextEditor?.document?.uri);
			}),
			addCommand(FictionWriter.security.exportKeys, () => {
				vscode.window.showInformationMessage("Copy and store the encryption key(s) below so you don't loose access to your encrypted files.", {
					modal: true,
					detail: this.options.globalPassword.value
				});
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