import vscode from 'vscode';
import {ProjectNode} from './projectNodes';
import {NodeType} from './nodeType';
import {log, notifier} from '../../core';

export const revealInExplorer = async (node: ProjectNode) => {
    const uri = vscode.Uri.file(node.id);
    const options = {reveal: true};

    return vscode.commands.executeCommand('revealInExplorer', uri, options);
};



/**
 * Adding a file to project, means adding the project tracking tag to the file name.
 * @param node
 */
export const addToProject = async (node: ProjectNode) => {
    const projectTag = 'fw';
    if (node.type !== NodeType.TextFile) {
        notifier.warn(`Cannot add ${node.item.name} to project`);
        return;
    }

    node.item.name += '.' + projectTag;
    const oldUri = vscode.Uri.file(node.id);
    const newUri = vscode.Uri.file(node.buildFsPath());
    return vscode.workspace.fs.rename(oldUri, newUri).then(
        () => {
            notifier.info(`File added to project as ${node.item.buildFsName()}`);
        }, (err) => {
            if (err) {
                notifier.warn("Could not add file to project");
                log.error(`Cannot add file ${node.id} ToProject`, err, {node, oldUri, newUri});
            }
        });
};