import {
    FwFileManager, FwItemBuilder,
    FwPermission,
    FwSubType,
    FwType,
    IAsyncCommand, log,
    notifier, ObjectProps,
    Permissions, retryAsync,
    SimpleSuffixOrderParser
} from '../../../core';
import vscode, {TextDocument} from 'vscode';
import {StateManager} from '../../../core/state';

/**
 * Reveals a file item in the VSCode Explorer view
 */
export class SplitActiveFile implements IAsyncCommand<vscode.TextEditor, void> {

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
        if (editor?.selection) {
            if (!editor?.selection.isEmpty) {
                newInfo.name = editor.document.getText(editor.selection);
            }
        }

        const newPath = await retryAsync(async (retry) => {

            const s = new SimpleSuffixOrderParser();
            const parsed = s.parse(fwItem.info.name);
            parsed.order = parsed.order?.length > 0
                ? [parsed.order[0] + retry]
                : [retry];
            const newName = s.serialize(parsed);
            newInfo.name = `${newName}`;
            log.tmp("SPLIT", fwItem.info.name, newInfo.name);

            const newFsRef = this._fwItemBuilder.fsRefToFwInfo.serialize(newInfo, {
                rootFolderPaths: [],
                fsExt: fwItem.fsRef.fsExt,
                fsDir: fwItem.fsRef.fsDir
            });
            return await this._fileManager.splitFile(fwItem.fsRef.fsPath,
                editor.selection.start.line,
                editor.selection.start.character,
                newFsRef.fsPath);
        });

        if (newPath) {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(newPath));

        } else {
            notifier.warn("File cannot be split");
        }
    }
}