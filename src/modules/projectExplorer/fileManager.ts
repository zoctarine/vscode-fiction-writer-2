import * as vscode from "vscode";
import {Disposable} from "vscode";
import {FwFile, FwFileInfo} from "../../common/fileNameManager";
import * as path from "path";


export function findCommonWorkspaceFoldersPath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];

    if (workspaceFolders?.length === 0) return "";

    const paths = workspaceFolders
        .map(folder => folder.uri.fsPath)
        .sort()
        .map(folder => folder.split(path.posix.sep));
    // Find the common root path
    const commonPath = paths.reduce((common, nextPath) => {
        let i = 0;
        while (i < common.length && i < nextPath.length && common[i] === nextPath[i]) {
            i++;
        }
        return common.splice(0, i);
    }, paths[0]);

    return path.normalize(commonPath.join(path.posix.sep));
}


interface File {
    name: string;
    path: string;
}

class FileManager implements Disposable {
    private _disposibles: Disposable[] = [];
    public files: FwFileInfo[] = [];

    dispose() {
        this._disposibles.forEach(disposable => {
            disposable.dispose();
        });
    }

    public initialize() {
        const watcher = vscode.workspace
            .createFileSystemWatcher('**/*._fw.md');
        watcher.onDidCreate((f) => this.onFilesChanged(f), this._disposibles);
        watcher.onDidDelete((f) => this.onFilesChanged(f), this._disposibles);
        this._disposibles.push(watcher);
    }

    private onFilesChanged(e: vscode.Uri): void {
        this.loadFiles().then(f => console.log(f.map(f => f)));
    }

    public async loadFiles(): Promise<FwFileInfo[]> {
        this.files = [];
        const allFiles = await vscode.workspace
            .findFiles('**/**/*.fw.md', '**/node_modules/**');
        const files: FwFileInfo[] = [];
        allFiles.forEach((file) => {
            files.push(FwFileInfo.parse(file.fsPath));
        });
        console.log("loadFiles:", files);
        this.files = files;
        return [...files.map(f => ({...f}))];
    }
}

export const fileManager = new FileManager();