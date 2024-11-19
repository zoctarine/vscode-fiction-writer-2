import vscode, {QuickPickItemKind, workspace} from 'vscode';
import path from 'path';
import {
    addCommand,
    FictionWriter,
    FwControl,
    FwPermission,
    log,
    notifier,
    Permissions, SimpleSuffixOrderParser
} from '../../core';

import {ProjectNode} from './models/projectNode';
import {retryAsync} from '../../core/lib/retry';
import {FwItem} from '../../core/fwFiles/FwItem';

//addCommand(FictionWriter.files.combine, async () => {a

export const combineFiles = async (...items: FwItem[]) => {
    // if (!items || items.length < 2) return;
    //
    // const names = items.map((i) => ({
    //     label: i.fsRef?.fsName ?? '',
    //     kind: QuickPickItemKind.Default,
    //     detail: i.fsRef?.fsPath,
    //     description: i.fsRef?.fsExt
    // }));
    //
    // const name = await vscode.window.showQuickPick(names, {
    //     title: "Select the file to merge into"
    // });
    // if (!name) return;
    // let mergePath = name.detail;
    //
    // const result = await vscode.window.showWarningMessage("Combine files", {
    //     modal: true,
    //     detail: 'Are you sure you want to append contents of: \n\n' +
    //         items.filter(i => i.fsRef?.fsPath!== mergePath).map(i => i.ref.name).join("\n") + "\n\n" +
    //         ' to:\n\n' + name.label + "?" +
    //         "\n\n This action CANNOT be undone!"
    // }, "Ok");
    //
    // if (result === "Ok") {
    //     let mergedText = '';
    //     let mergePath = name.detail;
    //     for (const item of items) {
    //         let doc = await vscode.workspace.openTextDocument(item.ref.fsPath);
    //         if (!doc) throw new Error("Combine file doesn't exist!");
    //         const text = doc.getText();
    //         if (item.ref.fsPath === mergePath) {
    //             mergedText = text + "\n\n" + mergedText;
    //         } else {
    //             mergedText += "\n\n" + doc.getText();
    //         }
    //     }
    //
    //     await vscode.workspace.fs.writeFile(vscode.Uri.parse(mergePath), Buffer.from(mergedText, 'utf8'));
    //     for (const item of items) {
    //         if (item.ref.fsPath !== mergePath) {
    //             await vscode.workspace.fs.delete(vscode.Uri.parse(item.ref.fsPath));
    //         }
    //     }
    //     notifier.info("Files combined successfully!");
    // }
    //
    // if (editor?.selection) {
    //     if (editor?.selection.isEmpty) {
    //         const orderParser = new SimpleSuffixOrderParser();
    //         const parsed = orderParser.process(fwItem.ref.name);
    //         parsed.mainOrder = parsed.mainOrder ? parsed.mainOrder + 1 : parsed.mainOrder;
    //         newName = orderParser.build(parsed);
    //         log.tmp(newName);
    //
    //     } else {
    //         newName = editor.document.getText(editor.selection);
    //     }
    // }
    //
    // let splitName = `${fwItem.ref.orderString}${newName}${fwItem.ref.ext}`;
    //
    // const newPath = await retryAsync(async (retry) => {
    //     if (retry > 0) {
    //         splitName = `${fwItem.ref.orderString}${fwItem.ref.name} ${retry}${fwItem.ref.ext}`;
    //     }
    //     return await this.fileManager.splitFile(fwItem.ref.fsPath,
    //         editor.selection.start.line,
    //         editor.selection.start.character,
    //         splitName);
    // });
    //
    // if (newPath) {
    //     await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(newPath));
    //
    // } else {
    //     notifier.warn("File cannot be split");
    // }
};

/**
 * Reveals a file item in the VSCode Explorer view
 *
 */
export const revealInExplorer = async ({data: {fwItem}}: ProjectNode) => {
    if (!fwItem?.fsRef?.fsPath) return;

    const uri = vscode.Uri.file(fwItem.fsRef.fsPath);
    const options = {reveal: true};

    return vscode.commands.executeCommand('revealInExplorer', uri, options);
};


/**
 * Adding a file to project, means adding the project tracking tag to the file name.
 */
export const addToProject = async (item: FwItem | undefined) => {
    // if (!item) return;
    // if (item.ref?.control !== FwControl.Possible) {
    //     notifier.warn(`Cannot add ${item.ref.name} to project`);
    //     return;
    // }
    // const newName = item.ref.name + ".fw" + item.ref.ext;
    // const newPath = path.posix.join(item.ref.fsDir, newName);
    // const oldUri = vscode.Uri.file(item.ref.fsPath);
    // const newUri = vscode.Uri.file(newPath);
    //
    // return vscode.workspace.fs.rename(oldUri, newUri).then(
    //     () => {
    //         notifier.info(`File added to project as ${newName}`);
    //     }, (err) => {
    //         if (err) {
    //             notifier.warn("Could not add file to project");
    //             log.error(`Cannot add file ${item.ref.fsPath} ToProject`, err, {item, oldUri, newUri});
    //         }
    //     });
};


/**
 * Adding a file to project, means adding the project tracking tag to the file name.
 * @param items
 */
export const excludeFromProject = async (...items: FwItem[]) => {
    // if (!items || items.length === 0) return;
    //
    // // TODO: make so we exclude all
    // const item = items[0];
    // if (item.info?.control !== FwControl.Active) {
    //     notifier.warn(`Cannot exclude ${item.ref.name} from project`);
    //     return;
    // }
    //
    // let ext = item.ref.fsExt;
    // const options: string[] = [];
    // if (item.ref?.name.mainOrder ?? 0 > 0) {
    //     options.push(`${item.ref.fsName.substring(0, item.ref.fsName.length - item.ref.ext.length)}${ext}`);
    // }
    // options.push(`${item.ref.name}${ext}`);
    //
    // vscode.window.showWarningMessage(
    //         `Exclude ${item.ref.name}?`,
    //         {
    //             modal: true,
    //             detail:
    //                 `Excluding this file from the project will change it's name on disk to:\n\n` +
    //                 `Current name:\n ${item.ref.fsName}\n\n` +
    //                 `Choose the new name:`
    //         },
    //         ...options)
    //     .then(value => {
    //         if (value) {
    //             const oldUri = vscode.Uri.file(item.ref.fsPath);
    //             const newUri = vscode.Uri.file(path.posix.join(item.ref.fsDir, value));
    //             return vscode.workspace.fs.rename(oldUri, newUri).then(
    //                 () => {
    //                     notifier.info(`File removed from project as ${value}`);
    //                 }, (err) => {
    //                     if (err) {
    //                         notifier.warn("Could not remove file from project");
    //                         log.error(`Cannot remove file ${item.ref.name} from`, err, {node: item, oldUri, newUri});
    //                     }
    //                 });
    //         }
    //     });

};