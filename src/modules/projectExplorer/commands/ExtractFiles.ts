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
const l = log.for("ExtractFiles");

export class ExtractFiles implements IAsyncCommand<vscode.TextEditor, void> {

    constructor(private _fileManager: FwFileManager,
                private _stateManager: StateManager,
                private _fwItemBuilder: FwItemBuilder) {
    }

    async runAsync(editor?: vscode.TextEditor): Promise<void> {
        if (!editor) return;
        const doc = editor?.document;
        if (!doc) return;
        const fwItem = this._stateManager.get(doc.uri.fsPath)?.fwItem;
        if (!fwItem) return;
        if (!Permissions.check(fwItem?.info, FwPermission.Write)) return;
        const newInfo = ObjectProps.deepClone(fwItem.info);

        // get next order from existing children
        const nextChildOrder = this._fwItemBuilder.fsRefToFwInfo.orderParser.computeNextOrderFor(
            fwItem.children?.map(c => fwPath.parse(c).name) ?? [],
            fwItem.info.order
        );

        if (!editor?.selection || editor.selection.isEmpty) return;

        const selectedLines: string[] = [];
        const edit = new vscode.WorkspaceEdit();
        const selections = editor.selections.map(selection => {
            for (let line = selection.start.line; line <= selection.end.line; line++) {
                const lineText = doc.lineAt(line).text;
                if (lineText.length > 0) {
                    selectedLines.push(lineText);
                }
            }

            edit.delete(doc.uri, selection);
        });
        if (selections.length === 0) return;

        const originalOrder = [...newInfo.order];
        const parser = this._fwItemBuilder.fsRefToFwInfo;
        const fileMap = new Map<string, string>();
        const filenames: string[] = [];
        for (let line = 0; line < selectedLines.length; line++) {
            newInfo.name = fwPath.toFilename(selectedLines[line]);

            newInfo.order = [...originalOrder, line + nextChildOrder];
            const newRef = parser.serialize(newInfo, {
                rootFolderPaths: [],
                fsDir: fwItem.fsRef.fsDir,
                fsExt: fwItem.fsRef.fsExt
            });
            filenames.push(newRef.fsBaseName);
            if (newRef) fileMap.set(newRef.fsPath, selectedLines[line]);
            fileMap.set(newRef.fsPath, selectedLines[line]);
        }

        const optionOk = 'Ok';
        const result = await vscode.window.showWarningMessage("Create individual files for each line", {
            modal: true,
            detail: `The selected text will be split into ${fileMap.size} files: \n\n` +
                filenames.join("\n") +
                "\n\n This action CANNOT be undone!"
        }, optionOk);
        if (result !== optionOk) return;
        const createdFiles = await this._fileManager.batchCreateFiles(fileMap);
        if (createdFiles.length !== fileMap.size) {
            notifier.warn("Could not create all files");
        }

        if (await vscode.workspace.applyEdit(edit)) {
            // doc.save();
        }
    }
}


