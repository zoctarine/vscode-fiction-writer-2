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
import {FwItem, FwItemCloneBuilder, FwItemTools} from '../../../core/fwFiles/FwItem';
import {StateManager} from '../../../core/state';
import {fwPath} from '../../../core/FwPath';
import {FwItemOption, fwFilenameInput, fwItemPicker} from '../../../core/inputs';

/**
 * Reveals a file item in the VSCode Explorer view
 */
const l = log.for("ExtractFile");

export class ExtractFile implements IAsyncCommand<vscode.TextEditor, void> {

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

        if (!editor?.selection || editor.selection.isEmpty) return;

        const lines: string[] = [];
        const edit = new vscode.WorkspaceEdit();
        const selections = editor.selections.map(selection => {
            for (let line = selection.start.line; line <= selection.end.line; line++) {
                const lineText = doc.lineAt(line).text
                    .substring(selection.start.character, selection.end.character+1);

                if (lineText.length > 0) {
                    lines.push(lineText);
                }
            }
            edit.delete(doc.uri, selection);
        });
        if (selections.length === 0) return;

        const content = lines.reduce((acc, f) => acc + f, "");
        const builder = new FwItemCloneBuilder(fwItem, this._fwItemBuilder);

        const extracted = await builder
            .setFilename(fwPath.toFilename(lines.join(' ')))
            .incrementFileOrder()
            .clone();
        const nextPath = await builder.incrementFileOrder().clone();
        const nextOrdered = await builder.incrementFilename().clone();
        let selectedItem = await fwItemPicker([
            new FwItemOption(extracted, 'from selection'),
            new FwItemOption(nextPath, 'As sibling with same name'),
            new FwItemOption(nextOrdered, 'As duplicate')
        ]);
        if (!selectedItem) {
            return;
        }
        const fileName = await fwFilenameInput(selectedItem);
        if (!fileName) return;
        const newItem = await builder.setBasename(fileName).clone();
        const createdFile = await this._fileManager.createFile(newItem.fsRef.fsPath, content);
        if (!createdFile) {
            notifier.warn("Could not create all file");
        }

        if (await vscode.workspace.applyEdit(edit)) {
            // doc.save();
        }
    }
}


