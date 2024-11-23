import {
    DefaultOrderParser, PathScurryToFsRef,
    FwFileManager, FsRefToFwInfo, FwItemBuilder,
    FwPermission,
    FwSubType,
    FwType,
    IAsyncCommand, log,
    notifier, ObjectProps,
    Permissions
} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode, {InputBoxValidationSeverity} from 'vscode';
import {FwItem} from '../../../core/fwFiles/FwItem';
import {fwPath} from '../../../core/FwPath';
import {Path} from 'glob';
import {FsPathToFsRef} from '../../../core/fwFiles/parsers/fileName/FsPathToFsRef';

export class RenameNode implements IAsyncCommand<ProjectNode, string|undefined> {
    constructor(private _fileManager: FwFileManager, private _fwItemBuilder: FwItemBuilder) {
    };

    async runAsync(node?: ProjectNode) {
        if (!node?.data.fwItem) return;

        const {info, fsRef} = node.data.fwItem;
        const orderParser = new DefaultOrderParser();

        const parsed = orderParser.parse(info.name);
        const startIndex = fsRef.fsBaseName.indexOf(parsed.name);
        let endIndex = (startIndex > 0 ? startIndex : 0) + (parsed.name.length ?? 0);

        const getFwChanges = async (value: string) => {
            const nextPath = fwPath.join(fsRef.fsDir, value);

            const nextRef = {
                ...this._fwItemBuilder.fsPathToFsRef.parse(nextPath),
                fsIsFile: fsRef.fsIsFile,
                fsIsFolder: fsRef.fsIsFolder,
            };

            const nextInfo = this._fwItemBuilder.fsRefToFwInfo.parse(nextRef, {
                rootFolderPaths: vscode.workspace.workspaceFolders?.map((folder) => fwPath.asPosix(folder.uri.fsPath)) ?? []
            });

            const messages = [];
            if (nextInfo.order.join(".") !== info.order.join(".")) {
                messages.push("the file order segment");
            }
            if (nextRef.fsExt !== fsRef.fsExt) {
                messages.push(`the file type`);
            } else if (nextInfo.projectTag !== info.projectTag) {
                messages.push(`the FictionWriter extended extension`);
            }

            return messages;
        };
        const currentValue = fsRef.fsBaseName;
        const nextValue = await vscode.window.showInputBox({
            title: `Rename ${info.name}`,
            prompt: `New file name:`,
            valueSelection: [startIndex, endIndex],
            value: fsRef.fsBaseName,
            validateInput: async (value: string) => {
                if (!value || value === '') {
                    return {
                        message: "Value must be a valid filename",
                        severity: InputBoxValidationSeverity.Error
                    };
                }
                const messages = await getFwChanges(value);

                if (messages.length > 0) {
                    let last = messages.pop();
                    if (messages.length > 0) last = ` and ${last}`;
                    return {
                        message: `Warning: You changed ${messages.join(', ')}${last}`,
                        severity: InputBoxValidationSeverity.Warning
                    };
                }
            }
        });
        if (nextValue && nextValue !== currentValue) {
            let doRename = true;
            if ((await getFwChanges(nextValue)).length > 0) {
                doRename = await vscode.window.showWarningMessage("Are you sure?",
                    {
                        modal: true,
                        detail: `Renaming\n\n'${currentValue}'\n\nto:\n\n ${nextValue}\n\n may result in FictionWriter handling the file differently.\n\nJust make sure you are OK with this change.`,
                    },
                    "OK") === 'OK';
            }
            if (doRename) {
                try {
                    const nextPath =fwPath.join(fsRef.fsDir, nextValue);
                    await this._fileManager.renameFile(
                        fsRef.fsPath,
                        nextPath
                    );
                    return nextPath;
                } catch(err){
                    log.warn("Cannot rename file", err);
                }
            }
        }
    }
}