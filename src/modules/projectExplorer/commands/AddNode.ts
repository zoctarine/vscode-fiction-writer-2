import {FwFileManager, FwPermission, FwSubType, FwType, IAsyncCommand, notifier, Permissions} from '../../../core';
import {ProjectNode} from '../models/projectNode';
import vscode from 'vscode';

export class AddFileNode implements IAsyncCommand<ProjectNode, void> {
    constructor(private _fileManager: FwFileManager) {
    };

    async runAsync(node?: ProjectNode) {
        if (!node) return;

    }
}

// extract file ... (first line)

// extract files... (child/sibling)