import * as vscode from "vscode";
import {FwFile, Regex} from "./fwFile";
import * as path from "path";
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {DisposeManager} from './index';
import {glob} from 'glob';
import fs from 'node:fs';
import {FwFileInfo} from './fwFileInfo';


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
            this.loadFiles();
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

    public renameFile(oldPath: string, newPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(oldPath) || fs.existsSync(newPath)) {
                console.log(`Rename: File does not need moving: ${oldPath} -> ${newPath}`);
                resolve();
            } else {
                console.log("Rename: ", [oldPath, newPath]);
                vscode.workspace.fs.rename(vscode.Uri.parse(oldPath), vscode.Uri.parse(newPath),{
                    overwrite: false,
                }).then(resolve, reject);
            }
        });
    }

    public async batchRenameFiles(renameMap: { oldPath: string, newPath: string }[]) {
        renameMap.sort((a, b) => a.oldPath > b.oldPath ? 1 : a.oldPath === b.oldPath ? 0 : -1);
        for (const { oldPath, newPath } of renameMap) {
            try {
                await this.renameFile(oldPath, newPath);
            } catch(err){
                console.error(err);
                vscode.window.showErrorMessage(`Error renaming file: ${oldPath} -> ${newPath}`);
                break;
            }
        }
    }
}