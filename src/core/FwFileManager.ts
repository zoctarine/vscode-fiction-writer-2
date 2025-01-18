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
			watcher.onDidChange((f) => this._handlerFsWatcherEvent(f, FileChangeAction.Modified)),
			watcher.onDidCreate((f) => this._handlerFsWatcherEvent(f, FileChangeAction.Created)),
			watcher.onDidDelete((f) => this._handlerFsWatcherEvent(f, FileChangeAction.Deleted)),

			this._fileWorkerClient.onFilesChanged(e => this._handleOnWorkerFilesChanged(e)),
			this._fileWorkerClient.onFilesReloaded(e => this._handlerWorkerOnFileReload(e)),

			watcher,

			this._onFilesChanged,
			this._onFilesReloaded);
	}

	private _handlerFsWatcherEvent(e: vscode.Uri, action: FileChangeAction) {
		if (this._silentUpdates) return;

		this._fileWorkerClient.sendFileChanged(e.fsPath, action);
	}

	private async _handlerWorkerOnFileReload(fwFiles: Map<string, FwItem>) {
		log.debug("FileManager.onWorkerFileReload:", fwFiles.size);
		if (this._silentUpdates) return;
		if (fwFiles.size === 0) return;

		this._onFilesReloaded.fire(fwFiles);
	}

	private async _handleOnWorkerFilesChanged(fwFiles: Map<string, FwItem>) {
		log.debug("FileManager.onWorkerFileChanges:", fwFiles.size);
		if (this._silentUpdates) return;
		if (fwFiles.size === 0) return;
		log.debug("files", Array.from(fwFiles.values()).map(f => f.parent));
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
		this._ensureInWorkspace(oldPath);
		this._ensureInWorkspace(newPath);

		return new Promise((resolve, reject) => {
			if (!fwPath.exists(oldPath) || fwPath.exists(newPath)) {
				reject(`Path '${newPath}' already exists`);
			} else {
				vscode.workspace.fs.rename(vscode.Uri.parse(oldPath), vscode.Uri.parse(newPath), {
					overwrite: false,
				}).then(resolve, reject);
			}
		});
	}

	public async batchRenameFiles(renameMap: Map<string, string>) {
		this._silentUpdates = true;
		const renames = Array.from(renameMap.entries()).map(([oldPath, newPath]) => ({oldPath, newPath}));

		renames.sort((a, b) => a.oldPath > b.oldPath ? 1 : a.oldPath === b.oldPath ? 0 : -1);
		for (const {oldPath, newPath} of renames) {
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

	public async delete(fsPaths: string[]): Promise<any[] | undefined> {
		this._silentUpdates = true;
		const errors = [];
		for (const fsPath of fsPaths) {
			try {
				const uri = vscode.Uri.parse(fsPath);
				await vscode.workspace.fs.delete(uri, {
					recursive: true,
					useTrash: true,
				});
			} catch (err) {
				errors.push({fsPath, err});
			}
		}
		this._silentUpdates = false;
		this.onFilesChanged.bind(await this.loadFiles());
		return errors;
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

	public async splitFile(fsPath: string, breakLine: number, breakCharacter: number, newFsPath: string): Promise<string | undefined> {
		const doc = await this._open(fsPath);
		if (!doc) return undefined;
		const edit = new vscode.WorkspaceEdit();
		const splitPoint = new vscode.Range(breakLine, breakCharacter, doc.lineCount, 0);
		const splitContent = doc.getText(splitPoint);
		const newFile = await this.createFile(newFsPath, splitContent);
		if (newFile) {
			edit.delete(doc.uri, splitPoint);
			if (await vscode.workspace.applyEdit(edit)) {
				doc.save();
			}
			return newFsPath;
		}

		return undefined;
	}

	public async createFile(fsPath: string, content: string): Promise<boolean> {
		this._ensureInWorkspace(fsPath);

		const uri = vscode.Uri.parse(fsPath);

		if (fs.existsSync(fsPath)) {
			return false;
		}
		await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
		return true;
	}


	public async batchCreateFiles(fileMap: Map<string, string>): Promise<string[]> {
		this._silentUpdates = true;
		const createdFiles: string[] = [];
		for (const [fsPath, content] of fileMap) {
			try {
				const newFile = await this.createFile(fsPath, content);
				if (newFile) createdFiles.push(fsPath);
			} catch (err) {
				console.error(err);
				vscode.window.showErrorMessage(`Error creating file: ${fsPath}`);
				break;
			}
		}
		this._silentUpdates = false;
		this.onFilesChanged.bind(await this.loadFiles());
		return createdFiles;
	}

	public async createFolder(fsPath: string): Promise<boolean> {
		this._ensureInWorkspace(fsPath);
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

	private _ensureInWorkspace(fsPath: string) {
		if (vscode.workspace.asRelativePath(fsPath) === fsPath) {
			throw new Error('Could not create file as it is outside of current workspace');
		}
	}
}

