import vscode from 'vscode';
import {FileEncryptor} from '../../modules/security/fileEncryptor';
import path from 'path';
import crypto from 'crypto';

export class TempFileManager {
    private _tmpStorageLocation:vscode.Uri;

    constructor(private _context: vscode.ExtensionContext,
                private _fileEncryptor: FileEncryptor) {

        if (!this._context.storageUri) throw new Error("Cannot store temporary files");

        this._tmpStorageLocation = this._context.storageUri;
    }

    public getUriFor(uri: vscode.Uri): vscode.Uri {
        const filename = path.posix.parse(uri.fsPath).name;

        const hsh = FileEncryptor.hash(filename);

        const tmpUri = this._tmpStorageLocation
            ? path.posix.join(
                this._tmpStorageLocation.fsPath, filename + hsh + ".tmp")
            : uri.fsPath + ".tmp";

        return vscode.Uri.parse(tmpUri);
    }

    public async store(uri: vscode.Uri, content: string): Promise<vscode.Uri> {
        const tmpUri = this.getUriFor(uri);
        try {
            if (this._fileEncryptor.options.encryptTemporaryFilesEnabled.value){
               content = this._fileEncryptor.encrypt(content);
            }
            await vscode.workspace.fs.writeFile(this.getUriFor(uri), new TextEncoder().encode(content));
        } catch (err){
            await vscode.window.showErrorMessage(`Error adding ${uri.fsPath} to temp storage. ${err}`);
        }

        return tmpUri;
    }

    public async load(uri:vscode.Uri): Promise<string> {
        try {
            const tmpUri = this.getUriFor(uri);
            const doc = await vscode.workspace.openTextDocument(tmpUri);
            let content = doc.getText();
            if (this._fileEncryptor.options.encryptTemporaryFilesEnabled.value){
                content = this._fileEncryptor.decrypt(content);
            }

            return content;
        } catch (err){
            await vscode.window.showErrorMessage(`Error loading ${uri.fsPath} to temp storage. ${err}`);
            return "";
        }
    }

}