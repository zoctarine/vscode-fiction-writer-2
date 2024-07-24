import * as vscode from "vscode";
import {Disposable} from "vscode";

interface File{
    name: string;
    path: string;
}
class FileManager implements Disposable {
    private _disposibles: Disposable[] = [];
    public files:File[] = [];

    dispose() {
        this._disposibles.forEach(disposable => {
            disposable.dispose()
        })
    }

    public initialize() {
        const watcher = vscode.workspace
            .createFileSystemWatcher('**/*._fw.md');
        watcher.onDidCreate((f) => this.onFilesChanged(f), this._disposibles)
        watcher.onDidDelete((f) => this.onFilesChanged(f), this._disposibles)
        this._disposibles.push(watcher);
    }

    private onFilesChanged(e: vscode.Uri):void {
       this.loadFiles().then(f => console.log(f.map(f=>f.path)));
    }

    public async loadFiles(): Promise<File[]> {
        this.files = [];
        const allFiles = await vscode.workspace
            .findFiles('**/*._fw.md', '**/node_modules/**');
        const files: File[] = [];

        allFiles.forEach((file) => {
            files.push({name: file.path, path: file.fsPath});
        });
        this.files = files;
        return [...files.map(f => ({...f}))];
    }


}

export const fileManager = new FileManager();