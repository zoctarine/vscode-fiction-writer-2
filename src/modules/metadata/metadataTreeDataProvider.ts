import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {ThemeColor, ThemeIcon} from 'vscode';
import {FileManager} from '../../core';
import {InputFileProcessor} from '../../processors/inputFileProcessor';

export class MetadataTreeDataProvider implements vscode.TreeDataProvider<MetadataTreeItem> {
    constructor(private _fileManager: FileManager | undefined) {
    }

    getTreeItem(element: MetadataTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MetadataTreeItem): Thenable<MetadataTreeItem[]> {

        if (element) {
            return Promise.resolve(this.getChildItems());
        } else {
            return Promise.resolve(this.getChildItems());
        }
    }


    private getChildItems(): MetadataTreeItem[] {
        const processor = new InputFileProcessor(this._fileManager?.activeTextDocument?.getText() ?? "");
        const meta = processor.metadata.value;
        if (typeof meta === 'object') {
            return Object.keys(meta).map((key) => new MetadataTreeItem(key, meta[key] + "", vscode.TreeItemCollapsibleState.None));
        } else {
            return [new MetadataTreeItem(meta, "", vscode.TreeItemCollapsibleState.None)];
        }
    }
}

class MetadataTreeItem extends vscode.TreeItem {
    constructor(
        public readonly title: string,
        private subtitle: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(title, collapsibleState);
        this.tooltip = `${this.title}-${this.subtitle}`;
        this.description = this.subtitle;
        this.iconPath = new ThemeIcon('tag', new ThemeColor('editor.selectionBackground'));
    }

}
