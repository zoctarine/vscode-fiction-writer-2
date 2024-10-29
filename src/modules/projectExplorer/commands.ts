import vscode from 'vscode';
import {ProjectNode} from './projectNodes';
import {log, notifier} from '../../core';
import {FwControl, FwFile, FwItem} from '../../core/fwFiles';
import path from 'path';

export const revealInExplorer = async (node: ProjectNode) => {
    const uri = vscode.Uri.file(node.id);
    const options = {reveal: true};

    return vscode.commands.executeCommand('revealInExplorer', uri, options);
};


/**
 * Adding a file to project, means adding the project tracking tag to the file name.
 * @param item
 */
export const addToProject = async (item: FwItem | undefined) => {
    if (!item) return;
    if (item.control !== FwControl.Possible) {
        notifier.warn(`Cannot add ${item.ref.name} to project`);
        return;
    }
    const projectTag = '.fw';
    const newName = item.ref.name + projectTag + item.ref.ext;
    const newPath = path.posix.join(item.ref.fsDir, newName);
    const oldUri = vscode.Uri.file(item.ref.fsPath);
    const newUri = vscode.Uri.file(newPath);

    return vscode.workspace.fs.rename(oldUri, newUri).then(
        () => {
            notifier.info(`File added to project as ${newName}`);
        }, (err) => {
            if (err) {
                notifier.warn("Could not add file to project");
                log.error(`Cannot add file ${item.ref.fsPath} ToProject`, err, {fwItem: item, oldUri, newUri});
            }
        });
};


/**
 * Adding a file to project, means adding the project tracking tag to the file name.
 * @param item
 */
export const excludeFromProject = async (item: FwItem | undefined) => {
    if (!item) return;

    const projectTag = '.fw';
    if (item.control !== FwControl.Active) {
        notifier.warn(`Cannot exclude ${item.ref.name} from project`);
        return;
    }

    let ext = FwFile.toOriginalExtension(item.ref.ext);
    const options: string[] = [];
    if (item.order > 0) {
        options.push(`${item.ref.fsName.substring(0, item.ref.fsName.length - item.ref.ext.length)}${ext}`);
    }
    options.push(`${item.ref.name}${ext}`);

    vscode.window.showWarningMessage(
            `Exclude ${item.ref.name}?`,
            {
                modal: true,
                detail:
                    `Excluding this file from the project will change it's name on disk to:\n\n` +
                    `Current name:\n ${item.ref.fsName}\n\n` +
                    `Choose the new name:`
            },
            ...options)
        .then(value => {
            if (value) {
                const oldUri = vscode.Uri.file(item.ref.fsPath);
                const newUri = vscode.Uri.file(path.posix.join(item.ref.fsDir, value));
                return vscode.workspace.fs.rename(oldUri, newUri).then(
                    () => {
                        notifier.info(`File removed from project as ${value}`);
                    }, (err) => {
                        if (err) {
                            notifier.warn("Could not remove file from project");
                            log.error(`Cannot remove file ${item.ref.name} from`, err, {node: item, oldUri, newUri});
                        }
                    });
            }
        });

};