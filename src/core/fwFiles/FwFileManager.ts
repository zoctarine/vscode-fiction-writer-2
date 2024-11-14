import * as vscode from "vscode";
import * as path from "path";
import {ProjectsOptions} from '../../modules/projectExplorer/projectsOptions';
import {DisposeManager} from '../disposable';
import {glob} from 'glob';
import fs from 'node:fs';
import {
    FwFolderItem,
    FwItem,
    FwOtherFileItem,
    FwProjectFileItem, FwTextFileItem,
    FwWorkspaceFolderItem
} from './FwItem';
import {log, notifier} from '../logging';
import {FileWorkerClient} from '../../worker';
import {DefaultOrderParser} from './orderParsers/DefaultOrderParser';
import {FwFileNameParser} from './nameParsing/FwFileNameParser';
import {FwFileBuilder} from './builders/FwFileBuilder';

let loadFilesCalledCounter = 0;
export const asPosix = (mixedPath: string) => path.posix.normalize(mixedPath.split(path.sep).join(path.posix.sep));

export class FwFileManager extends DisposeManager {
    private _fileExtensions!: string[];
    private _onFilesChanged = new vscode.EventEmitter<FwItem[]>();
    private _silentUpdates = false;
    private _projectTag: string = '';

    constructor(private _options: ProjectsOptions, private _fileWorkerClient: FileWorkerClient) {
        super();
        this._loadOptions();
        // We listen to all file changes, and filter on the handler. Might change later
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        this.manageDisposable(
            this._options.fileTypes.onChanged(c => {
                this._loadOptions();
                this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));
            }),
            this._options.trackingTag.onChanged(c => {
                this._loadOptions();
                this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));
            }),
            watcher.onDidChange((f) => this._handleEvent(f, 'change')),
            watcher.onDidCreate((f) => this._handleEvent(f, 'create')),
            watcher.onDidDelete((f) => this._handleEvent(f, 'delete')),

            this._fileWorkerClient.onFilesChanged(f => this._processFileChanges(f)),

            watcher);
    }

    private _loadOptions() {
        // make sure extensions don't start with '.'
        this._fileExtensions = this._options.fileTypes.value.map(e => !e.startsWith('.') ? `.${e}` : e);
        this._projectTag = this._options.trackingTag.value;
        if (!this._projectTag) this._projectTag = 'fw';
    }

    // private _changes = new Map<string, string>();
    // private _changeTimeout: NodeJS.Timeout | undefined;
    //
    // private _handleEvent(e: vscode.Uri, action: string){
    //     if (this._silentUpdates) return;
    //     if (this._changeTimeout) {
    //         clearTimeout(this._changeTimeout);
    //     }
    //     this._changes.set(e.fsPath, action);
    //
    //     this._changeTimeout = setTimeout(()=>this._processFileChanges(), 1000);
    // }
    //
    // private async _processFileChanges(){
    //     if (this._silentUpdates) return;
    //     const changes = [...this._changes.entries()];
    //     this._changes.clear();
    //     if (changes.length === 0) return;
    //    this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));
    // }

    private _handleEvent(e: vscode.Uri, action: string){
        if (this._silentUpdates) return;

        this._fileWorkerClient.sendFileChanged(e.fsPath, action);
    }
    private async _processFileChanges(paths: string[]){
        if (this._silentUpdates) return;
        if (paths.length === 0) return;
       this.loadFiles().then((fi) => this._onFilesChanged.fire(fi));
    }

    public get onFilesChanged() {
        return this._onFilesChanged.event;
    }

    public async loadFiles(): Promise<FwItem[]> {
        loadFilesCalledCounter++;
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

                    const item = await this._parse(file);
                    files.push(item);
                } catch (err) {
                    console.error(err);
                }
            }));
        }
        return files;
    }

    public renameFile(oldPath: string, newPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(oldPath) || fs.existsSync(newPath)) {
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

    public async splitFile(fsPath: string, breakLine: number, breakCharacter: number, newName: string): Promise<string | undefined> {
        const doc = await this._open(fsPath);
        if (!doc) return undefined;
        const parsed = path.posix.parse(fsPath);

        const edit = new vscode.WorkspaceEdit();
        const splitPoint = new vscode.Range(breakLine, breakCharacter, doc.lineCount, 0);
        const splitContent = doc.getText(splitPoint);
        let newPath = path.posix.join(parsed.dir, newName);
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

    private async _open(fsPath: string): Promise<vscode.TextDocument | undefined> {
        return await vscode.workspace.openTextDocument(vscode.Uri.parse(fsPath));
    }

    public async _parse(fsPath: string): Promise<FwItem> {
        fsPath = asPosix(fsPath);
        const workspaceFolders = vscode.workspace.workspaceFolders?.map(f => asPosix(f.uri.fsPath)) ?? [];

        const fwFile = await new FwFileBuilder().buildAsync({fsPath});
        const ref = fwFile.ref;

        const isWorkspaceFolder = ref.fsIsFolder && workspaceFolders.includes(fsPath);
        const isTextFile = ref.fsIsFile && this._fileExtensions.includes(ref.fsExt);
        const isProjectFile = ref.fsIsFile && ref.projectTag.length > 0 && isTextFile;
        const result = new FactorySwitch<FwItem>()
            .case(isWorkspaceFolder, () => new FwWorkspaceFolderItem(ref))
            .case(ref.fsIsFolder, () => new FwFolderItem(ref))
            .case(isProjectFile, () => new FwProjectFileItem(ref))
            .case(isTextFile, () => new FwTextFileItem(ref))
            .default(() => new FwOtherFileItem(ref))
            .create();

        const {order = []} = ref;
        result.order = order.pop() ?? 0;
        result.parentOrder = order;
        result.orderBy = ref.orderedName;

        return result;
    }
}

/**
 * Factory for creating objects based on condition.
 * The {@link case} {@link when} expressions are evaluated in the order they are added
 * The first match will be chosen to create the object.
 */
export class FactorySwitch<T> {
    _builders: { create: () => T, when: boolean | (() => boolean) }[] = [];


    default(create: () => T): FactorySwitch<T> {
        this._builders.push({create, when: true});
        return this;
    }

    case(when: boolean | (() => boolean),
         create: () => T): FactorySwitch<T> {
        this._builders.push({create, when});
        return this;
    }

    create(): T {
        for (let builder of this._builders) {
            if (builder.when === true || (typeof builder.when === 'function' && builder.when())) {
                return builder.create();
            }
        }

        throw new Error(`No suitable builder found`);
    }


}