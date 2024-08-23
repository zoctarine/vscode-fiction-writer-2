import {SecurityOptions} from './securityOptions';
import * as crypto from 'crypto';
import vscode from 'vscode';
import {fileSerializer} from '../richTextEditor/utils/fileExtensions';

export class FileEncryptor {
    constructor(public options: SecurityOptions) {
    }

    public async encryptDocument(documentUri?: vscode.Uri) {
        if (!documentUri) return;
        const doc = await vscode.workspace.openTextDocument(documentUri);
        if (!doc) return;

        const enc = this._encrypt(doc.getText(), this.options.globalPassword.value);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            doc.uri,
            new vscode.Range(0, 0, doc.lineCount, 0),
            enc);

        return vscode.workspace.applyEdit(edit);
    }

    public async decryptDocument(documentUri?: vscode.Uri) {
        if (!documentUri) return;
        const doc = await vscode.workspace.openTextDocument(documentUri);
        if (!doc) return;

        const enc = this._decrypt(doc.getText(), this.options.globalPassword.value);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            doc.uri,
            new vscode.Range(0, 0, doc.lineCount, 0),
            enc);

        return vscode.workspace.applyEdit(edit);
    }

    public encrypt(text:string){
        return this._encrypt(text,this.options.globalPassword.value);
    }

    public decrypt(text:string){
        return this._decrypt(text,this.options.globalPassword.value);
    }
    public hash(text: string){
        return crypto.createHash('sha256').update(text).digest('hex');
    }

    private _encrypt(text:string, password:string):string {
        // Generate a random Initialization Vector (IV)
        const iv = crypto.randomBytes(16);

        // Derive a key from the password
        const key = crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha256');

        // Create an AES-256-CBC cipher
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        // Encrypt the text
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Return the IV and the encrypted data in a single buffer
        return iv.toString('hex') + ':' + encrypted;
    }
    private _decrypt(encryptedData:string, password:string) {
        const [ivHex, encryptedHex] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        // const encryptedText = Buffer.from(encryptedHex, 'hex');
        const key = crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha256');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}