import vscode from 'vscode';
import {DisposeManager, FwFile, FwFileInfo} from '../../../core';
import {InputFileProcessor} from '../../../processors';
import {FwType} from '../../../core/fwFileInfo';
import {FwFileManager} from '../../../core/fwFileManager';
import {projectsModule} from '../../projectExplorer';

export class ProjectCacheItem {
    public fsPath!: string;
    public metadata?: {};
    public displayName?: string;
}

export class ProjectCache extends DisposeManager{
    private _cache: Map<string, any> = new Map<string, any>();
    private readonly _onCacheChanged = new vscode.EventEmitter<void>();

    constructor(fileManager: FwFileManager) {
        super();

        this.manageDisposable(
            fileManager.onFilesChanged(files => this.load(files)) ?? vscode.Disposable.from(),
        );

        projectsModule.fileManager?.loadFiles().then((files) => this.load(files));
    }

    async load(files: FwFileInfo[]) {
        for (const file of files) {
            await this.update(file);
        }

        this._onCacheChanged.fire();
    }

    async update(file: FwFileInfo) {
        if (file.type !== FwType.File) return;

        this._cache.set(file.fsPath, {
            metadata: new InputFileProcessor(
                (await vscode.workspace.openTextDocument(file.fsPath) ?? "")?.getText())
                .metadata?.value,
            displayName: file.name,
            fsPath: file.fsPath
        });
    }

    delete(fsPath: string) {
        this._cache.delete(fsPath);
    }

    get(fsPath: string) {
        return this._cache.get(fsPath);
    }

    get entries() {
        return [...this._cache.values()];
    }

    get onCacheChanged() {
        return this._onCacheChanged.event;
    }
}