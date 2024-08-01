import * as vscode from "vscode";
import {Disposable} from "vscode";
import {FwFile, FwFileInfo, Regex} from "../../core/fileNameManager";
import * as path from "path";
import {ProjectsOptions} from './projectsOptions';
import {DisposeManager} from '../../core';
import {glob} from 'glob';
import fs from 'node:fs';


export const asPosix = (mixedPath: string) => path.posix.normalize(mixedPath.split(path.sep).join(path.posix.sep));


export class FwFileManager extends DisposeManager {
    private readonly _fileRegex: RegExp;
    private readonly _fileGlobpattern: string;
    private readonly _fileExtensions: string[];

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
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }
        const files: FwFileInfo[] = [];

        for (const folder of workspaceFolders) {
            const dirs = await glob(`**/**`, {cwd: folder.uri.fsPath, absolute: true});
            await Promise.all(dirs.map(async (file) => {
                try {
                    const stat = await fs.promises.stat(file);
                    files.push(
                        FwFileInfo.parse(asPosix(file), this._fileExtensions, stat.isDirectory()));
                } catch (err) {
                    console.error(err);
                }
            }));
        }

        return [...files.map(f => ({...f}))];

    }
}