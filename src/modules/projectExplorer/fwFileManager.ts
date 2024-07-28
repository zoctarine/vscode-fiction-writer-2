import * as vscode from "vscode";
import {Disposable} from "vscode";
import {FwFile, FwFileInfo, Regex} from "../../core/fileNameManager";
import * as path from "path";
import {ProjectsOptions} from './projectsOptions';
import {DisposeManager} from '../../core';

export const asPosix = (mixedPath:string) => mixedPath.split(path.sep).join(path.posix.sep);


interface File {
    name: string;
    path: string;
}

export class FwFileManager extends DisposeManager {
    private readonly _fileRegex: RegExp;
    private readonly _fileGlobpattern: string;
    private readonly _fileExtensions: string[];
    public files: FwFileInfo[] = [];

    constructor(private _options: ProjectsOptions) {
        super();
        this._fileExtensions = this._options.fileTypes.value;

        this._fileRegex = new RegExp(`\.(${this._fileExtensions.map(Regex.escape).join('|')})$`, 'gi');
        this._fileGlobpattern = `**/*.{${this._fileExtensions.join(',')}}`;

        // We listen to all file changes, and filter on the handler. Might change later
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.*');
        this.manageDisposable(
            watcher.onDidCreate((f) => this.onFilesChanged(f)),
            watcher.onDidDelete((f) => this.onFilesChanged(f)),
            watcher);
    }

    public isFwFile(fsPath: string): boolean {
        return this._fileRegex.test(fsPath);
    }

    private onFilesChanged(e: vscode.Uri): void {
        if (this.isFwFile(e.fsPath)) {
            this.loadFiles().then(f => console.log(f.map(f => f)));
        }
    }

    public async loadFiles(): Promise<FwFileInfo[]> {
        this.files = [];
        const allFiles = await vscode.workspace.findFiles(this._fileGlobpattern);
        const files: FwFileInfo[] = [];
        allFiles.forEach((file) => {
            files.push(FwFileInfo.parse(asPosix(file.fsPath), this._fileExtensions));
        });
        this.files = files;
        return [...files.map(f => ({...f}))];
    }
}