import {
    DefaultOrderParser,
    FwFileManager, FwItemBuilder,
    FwPermission,
    FwSubType,
    FwType,
    IAsyncCommand, IFsRef, log,
    notifier, ObjectProps,
    Permissions, retryAsync,
    SimpleSuffixOrderParser
} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode, {TextDocument} from 'vscode';
import {FwItem} from '../../../core/fwFiles/FwItem';
import {StateManager} from '../../../core/state';
import {fwPath} from '../../../core/FwPath';

/**
 * Reveals a file item in the VSCode Explorer view
 */
const l = log.for("ExtractFile");
export enum ExtractFileType {
    Single = 'single',
    Multiple = 'multiple',
}

export class ExtractFile implements IAsyncCommand<vscode.TextEditor, void> {

    constructor(private _fileManager: FwFileManager,
                private _stateManager: StateManager,
                private _fwItemBuilder: FwItemBuilder,
                private _extractTypes: ExtractFileType) {
    }

    async runAsync(editor?: vscode.TextEditor): Promise<void> {
        if (!editor) return;
        const doc = editor?.document;
        if (!doc) return;
        const fwItem = this._stateManager.get(doc.uri.fsPath)?.fwItem;
        if (!fwItem) return;
        if (!Permissions.check(fwItem?.info, FwPermission.Write)) return;
        const newInfo = ObjectProps.deepClone(fwItem.info);

        if (!editor?.selection || editor.selection.isEmpty) return;

        const fileNames:string[] = [];
        const edit = new vscode.WorkspaceEdit();
        const selections = editor.selections.map(selection => {
            for (let line = selection.start.line; line <= selection.end.line; line++) {
                const lineText = doc.lineAt(line).text;
                if (lineText.length > 0) {
                    fileNames.push(lineText);
                }
            }

            edit.delete(doc.uri, selection);
        });
        if (selections.length === 0) return;

        const originalOrder = [...newInfo.order];
        const parser = this._fwItemBuilder.fsRefToFwInfo;
        const fileMap = new Map<string, string>();

        if (this._extractTypes === ExtractFileType.Single){
            newInfo.name = newInfo.name + " 1";
            const newRef = parser.serialize(newInfo, {
                rootFolderPaths: [],
                fsDir: fwItem.fsRef.fsDir,
                fsExt: fwItem.fsRef.fsExt
            });
            fileMap.set(newRef.fsPath, fileNames.reduce((acc, f) => acc + f, ""));
        }

        // TODO: extract these to methods, or commands
        // make sure edits are not deleted if file not created
        // make also numbering with suffix for each created file
        if (this._extractTypes === ExtractFileType.Multiple) {
            for (let line = 0; line < fileNames.length; line++) {
                newInfo.name = fwPath.toFilename(fileNames[line]);
                newInfo.order = [...originalOrder, line + 1];
                const newRef = parser.serialize(newInfo, {
                    rootFolderPaths: [],
                    fsDir: fwItem.fsRef.fsDir,
                    fsExt: fwItem.fsRef.fsExt
                });

                if (newRef) fileMap.set(newRef.fsPath, fileNames[line]);
                fileMap.set(newRef.fsPath, fileNames[line]);
            }
        }

        l.trace("FileNames", [...fileMap.keys()]);

        const createdFiles = await this._fileManager.batchCreateFiles(fileMap);
        if (createdFiles.length !== fileMap.size) {
            notifier.warn("Could not create all files");
        }

        if (await vscode.workspace.applyEdit(edit)) {
            // doc.save();
        }
    }
}


