import * as vscode from "vscode";
import {FwFile, RegEx} from "./fwFile";
import * as path from "path";
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {DisposeManager} from './disposable';
import {glob} from 'glob';
import fs from 'node:fs';
import {FwFileInfo} from './fwFileInfo';


export const asPosix = (mixedPath: string) => path.posix.normalize(mixedPath.split(path.sep).join(path.posix.sep));

export class FwFileManager extends DisposeManager {
    private _fileRegex!: RegExp;
    private _fileGlobpattern!: string;
    private _fileExtensions!: string[];
    private _onFilesChanged = new vscode.EventEmitter<FwFileInfo[]>();
    private _silentUpdates = false;

    constructor(private _options: ProjectsOptions) {
        super();

        this._loadOptions();
        // We listen to all file changes, and filter on the handler. Might change later
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.*');
        this.manageDisposable(
            this._options.fileTypes.onChanged(c => {this._loadOptions(); this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));}),
            this._options.trackingTag.onChanged(c => {this._loadOptions(); this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));}),
            watcher.onDidChange((f) => this._fileChangeHandler(f)),
            watcher.onDidCreate((f) => this._fileChangeHandler(f)),
            watcher.onDidDelete((f) => this._fileChangeHandler(f)),
            watcher);
    }

    public isFwFile(fsPath: string): boolean {
        return this._fileRegex.test(fsPath);
    }

    private _loadOptions(){
        this._fileExtensions = this._options.fileTypes.value.map(e => e.startsWith('.') ? e.substring(1) : e);

        const projectTag = this._options.trackingTag.value;
        if (projectTag !== ''){
            this._fileGlobpattern = `**/*.${projectTag}{.${this._fileExtensions.join(',.')},}`;
            this._fileExtensions = this._fileExtensions.map(e => `${projectTag}.${e}`);
            this._fileRegex = new RegExp(`\.(${this._fileExtensions.map(RegEx.escape).join('|')}|${RegEx.escape(projectTag)})$`, 'i');
        } else {
            this._fileGlobpattern = `**/*{.${this._fileExtensions.join(',.')},/}`;
            this._fileRegex = new RegExp(`\.(${this._fileExtensions.map(RegEx.escape).join('|')})$`, 'i');
        }
    }

    private _fileChangeHandler(e: vscode.Uri): void {
        if (this._silentUpdates) return;
        if (this.isFwFile(e.fsPath)) {

            fs.promises.stat(e.fsPath).then((stat) => {
                const fwInfo = FwFileInfo.parse(asPosix(e.fsPath), this._fileExtensions, stat.isDirectory());
                this._onFilesChanged.fire([fwInfo]);
            });
            // // TODO: only load the changed file
            // this.loadFiles()
            //     .then((fi) => this._onFilesChanged.fire(fi));
        }
    }

    public get onFilesChanged() {
        return this._onFilesChanged.event;
    }

    public async loadFiles(): Promise<FwFileInfo[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }
        const files: FwFileInfo[] = [];

        for (const folder of workspaceFolders) {
            const dirs = await glob(this._fileGlobpattern, {cwd: folder.uri.fsPath, absolute: true, dot: false, ignore: ['**/.vscode/**']});
            await Promise.all(dirs.map(async (file) => {
                try {
                    const stat = await fs.promises.stat(file);
                    const item = FwFileInfo.parse(asPosix(file), this._fileExtensions, stat.isDirectory());
                    files.push(item);
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
                // console.log(`Rename: File does not need moving: ${oldPath} -> ${newPath}`);
                resolve();
            } else {
                vscode.workspace.fs.rename(vscode.Uri.parse(oldPath), vscode.Uri.parse(newPath), {
                    overwrite: false,
                }).then(resolve, reject);
            }
        });
    }

    public async batchRenameFiles(renameMap: { oldPath: string, newPath: string }[]) {
        this._silentUpdates = true;
        renameMap.sort((a, b) => a.oldPath > b.oldPath ? 1 : a.oldPath === b.oldPath ? 0 : -1);
        for (const {oldPath, newPath} of renameMap) {
            try {
                await this.renameFile(oldPath, newPath);
            } catch (err) {
                console.error(err);
                vscode.window.showErrorMessage(`Error renaming file: ${oldPath} -> ${newPath}`);
                break;
            }
        }
        this._silentUpdates = false;
        this.onFilesChanged.bind(await this.loadFiles());
    }

    public deleteFile(fsPath: string): Thenable<void> {
        const uri = vscode.Uri.parse(fsPath);
        if (this._options.rootFoldersEnabled.value) {
            const trashFolder = this._options.rootFolderNames.trash;
            const workspace = vscode.workspace.getWorkspaceFolder(uri);
            if (workspace){
                const trashPath = path.posix.join(workspace.uri.fsPath, trashFolder);
                if (!fs.existsSync(trashPath)) {
                    fs.mkdirSync(trashPath);
                }
                const file = path.posix.basename(fsPath);
                const trashUri = vscode.Uri.parse(path.posix.join(trashPath, file));
                return vscode.workspace.fs.rename(uri, trashUri, {overwrite: true}).then(() => {
                    return;
                });
            }
        }

        return Promise.resolve();
    }
}