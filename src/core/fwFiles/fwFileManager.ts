import * as vscode from "vscode";
import {DefaultOrderParser, FwFile, FwFileProcessor} from "./fwFile";
import * as path from "path";
import {ProjectsOptions} from '../../modules/projectExplorer/projectsOptions';
import {DisposeManager} from '../disposable';
import {glob} from 'glob';
import fs from 'node:fs';
import {FwControl, FwItem, FwType} from './fwItem';
import {RegEx} from '../regEx';
import {log} from '../logging';


export const asPosix = (mixedPath: string) => path.posix.normalize(mixedPath.split(path.sep).join(path.posix.sep));

export class FwFileManager extends DisposeManager {
    private _fileExtensions!: string[];
    private _onFilesChanged = new vscode.EventEmitter<FwItem[]>();
    private _silentUpdates = false;
    private _projectTag: string = '';

    constructor(private _options: ProjectsOptions) {
        super();
        this._loadOptions();
        // We listen to all file changes, and filter on the handler. Might change later
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.*');
        this.manageDisposable(
            this._options.fileTypes.onChanged(c => {
                this._loadOptions();
                this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));
            }),
            this._options.trackingTag.onChanged(c => {
                this._loadOptions();
                this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));
            }),
            watcher.onDidChange((f) => this._fileChangeHandler(f)),
            watcher.onDidCreate((f) => this._fileChangeHandler(f)),
            watcher.onDidDelete((f) => this._fileChangeHandler(f)),

            watcher);
    }

    private _loadOptions() {
        // make sure extensions don't start with '.'
        this._fileExtensions = this._options.fileTypes.value.map(e => !e.startsWith('.') ? `.${e}` : e);
        this._projectTag = this._options.trackingTag.value;
        if (!this._projectTag) this._projectTag = 'fw';
    }

    private _fileChangeHandler(e: vscode.Uri): void {
        if (this._silentUpdates) return;
        fs.promises.stat(e.fsPath).then((stat) => {
            const fwInfo = this._parse(asPosix(e.fsPath), stat.isDirectory());
            this._onFilesChanged.fire([fwInfo]);
        });
    }

    public get onFilesChanged() {
        return this._onFilesChanged.event;
    }

    public async loadFiles(): Promise<FwItem[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            return [];
        }
        const files: FwItem[] = [];

        for (const folder of workspaceFolders) {
            const dirs = await glob("**",
                {
                    cwd: folder.uri.fsPath,
                    absolute: true,
                    dot: false,
                    ignore: ['**/.vscode/**']
                });
            await Promise.all(dirs.map(async (file) => {
                try {
                    const stat = await fs.promises.stat(file);
                    const item = this._parse(asPosix(file), stat.isDirectory());
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
            if (workspace) {
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

    public async updateFile(fsPath: string, newContent: string, save: boolean = true): Promise<void> {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(fsPath));
        if (!doc) return;
        const edit = new vscode.WorkspaceEdit();

        edit.replace(
            doc.uri,
            new vscode.Range(0, 0, doc.lineCount, 0),
            newContent);

        if (await vscode.workspace.applyEdit(edit)) {
            if (save) doc.save();
        }
    }

    public _parse(fsPath: string, isDirectory?: boolean): FwItem {
        const fileNameParser = new FwFileProcessor(new DefaultOrderParser());
        const file = fileNameParser.process(fsPath);
        const result = new FwItem(file);

        result.type = isDirectory ? FwType.Folder : FwType.File;
        result.data = file.data;
        result.order = 0;
        result.control = FwControl.Never;

        const order = file.order ?? [];
        if (order.length > 0) {
            result.order = order[order.length - 1];
            result.parentOrder = order.slice(0, -1);
        }
        const isTextFile = !isDirectory && this._fileExtensions.includes(file.fsExt);
        const isProjectFile = !isDirectory && file.projectTag && isTextFile;

        if (isProjectFile) {
            result.control = FwControl.Active;
        } else if (isTextFile) {
            result.control = FwControl.Possible;
        } else {
            result.control = FwControl.Never;
        }

        // const orderPrefix = result.order > 0 ? result.order.toString() : '';
        // result.orderString = `${orderPrefix}_${result.name}_${result.ext}`;
        result.orderBy = file.orderedName;
        return result;
    }
}