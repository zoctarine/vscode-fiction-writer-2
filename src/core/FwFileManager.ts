import * as vscode from "vscode";
import * as path from "path";
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {DisposeManager} from './disposable';
import fs from 'node:fs';
import {log, notifier} from './logging';
import {FileWorkerClient} from '../worker/FileWorkerClient';
import {FileChangeAction} from '../worker/models';
import {fwPath, FwPath} from './FwPath';
import {FwItem} from './fwFiles/FwItem';

export const asPosix = (mixedPath: string) => path.posix.normalize(mixedPath.split(path.sep).join(path.posix.sep));


export class FwFileManager extends DisposeManager {
    private _onFilesChanged = new vscode.EventEmitter<Map<string, FwItem>>();
    private _onFilesReloaded = new vscode.EventEmitter<Map<string, FwItem>>();
    private _silentUpdates = false;

    constructor(private _options: ProjectsOptions, private _fileWorkerClient: FileWorkerClient) {
        super();
        // We listen to all file changes, and filter on the handler. Might change later
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.manageDisposable(
            watcher.onDidChange((f) => this._handleEvent(f, FileChangeAction.Modified)),
            watcher.onDidCreate((f) => this._handleEvent(f, FileChangeAction.Created)),
            watcher.onDidDelete((f) => this._handleEvent(f, FileChangeAction.Deleted)),

            this._fileWorkerClient.onFilesChanged(e => this._processFileChanges(e)),
            this._fileWorkerClient.onFilesReloaded(e => this._processFileReloaded(e)),

            watcher,

            this._onFilesChanged,
            this._onFilesReloaded);
    }

    private _handleEvent(e: vscode.Uri, action: FileChangeAction) {
        if (this._silentUpdates) return;

        this._fileWorkerClient.sendFileChanged(e.fsPath, action);
    }

    private async _processFileReloaded(fwFiles: Map<string, FwItem>) {
        log.debug("Reloading files :", fwFiles.size);
        if (this._silentUpdates) return;
        if (fwFiles.size === 0) return;

        this._onFilesReloaded.fire(fwFiles);
    }

    private async _processFileChanges(fwFiles: Map<string, FwItem>) {
        log.debug("Files changed:", fwFiles.size);
        if (this._silentUpdates) return;
        if (fwFiles.size === 0) return;

        this._onFilesChanged.fire(fwFiles);
    }

    public get onFilesChanged() {
        return this._onFilesChanged.event;
    }

    public get onFilesReloaded() {
        return this._onFilesReloaded.event;
    }

    public async loadFiles(): Promise<void> {
        this._fileWorkerClient.sendWorkspaceFilesChanged(
            vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath) ?? []
        );

    }

    public renameFile(oldPath: string, newPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!fwPath.exists(oldPath) || fwPath.exists(newPath)) {
                notifier.warn(`Could not rename file ${oldPath} to ${newPath}`);
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
                if (!fwPath.exists(trashPath)) {
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

    public async splitFile(fsPath: string, breakLine: number, breakCharacter: number, newName: string): Promise<string | undefined> {
        const doc = await this._open(fsPath);
        if (!doc) return undefined;
        const parsed = fwPath.parse(fsPath);

        const edit = new vscode.WorkspaceEdit();
        const splitPoint = new vscode.Range(breakLine, breakCharacter, doc.lineCount, 0);
        const splitContent = doc.getText(splitPoint);
        let newPath = fwPath.join(parsed.dir, newName);
        const newFile = await this.createFile(newPath, splitContent);
        if (newFile) {
            edit.delete(doc.uri, splitPoint);
            if (await vscode.workspace.applyEdit(edit)) {
                doc.save();
            }
            return newPath;
        }

        return undefined;
    }


    public async createFile(fsPath: string, content: string): Promise<boolean> {
        const uri = vscode.Uri.parse(fsPath);
        if (fs.existsSync(fsPath)) {
            return false;
        }
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        return true;
    }

    public async createFolder(fsPath: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.parse(fsPath);
            if (fs.existsSync(fsPath)) {
                log.warn(this.createFolder.name, `Folder ${fsPath} already exists`);
                return false;
            }
            await vscode.workspace.fs.createDirectory(uri);
            return true;
        } catch (err) {
            log.warn(this.createFolder.name, `Could not create folder ${fsPath}`, err);
            return false;
        }
    }

    private async _open(fsPath: string): Promise<vscode.TextDocument | undefined> {
        return vscode.workspace.openTextDocument(vscode.Uri.parse(fsPath));
    }
}

