import * as vscode from 'vscode';
import * as path from 'path';
import {WordStatTreeItem} from './wordStatTreeItem';
import {DisposeManager, RegEx} from '../../core';
import {Constants} from './constants';
import {TreeItem, ViewBadge} from 'vscode';


export class WordFrequencyTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<WordStatTreeItem> {
    private _document: vscode.TextDocument | undefined;
    private _treeView: vscode.TreeView<WordStatTreeItem> | undefined;

    constructor() {
        super();

        this._treeView = vscode.window.createTreeView('fictionWriter.views.wordFrequency', {treeDataProvider: this});

        this.manageDisposable(
            this._treeView,
            this._treeView.onDidChangeVisibility((e) => {
                if (e.visible) {
                    this.refresh();
                }
            })
        );
    }

    public open() {
        if (this._document) {
            vscode.commands.executeCommand('vscode.open', this._document.uri);
        }
    }

    getTreeItem(element: WordStatTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: WordStatTreeItem): Thenable<WordStatTreeItem[]> {
        if (!this._document) {
            return Promise.resolve([]);
        }

        if (element) {
            const rawText = this._document.getText();
            const text = rawText.replace(RegEx.Pattern.METADATA_BLOCK, '');
            return Promise.resolve(
                this._getFrequencies(text, element.count)
            );
        } else {
            return Promise.resolve([
                new WordStatTreeItem("1 Word", '', 1, 'Word frequency', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
                new WordStatTreeItem("2 Words", '', 2, 'Two word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
                new WordStatTreeItem("3 Words", '', 3, 'Three word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
                new WordStatTreeItem("4 Words", '', 4, 'Four word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
                new WordStatTreeItem("5 Words", '', 5, 'Five word phrases', vscode.ThemeIcon.Folder, vscode.TreeItemCollapsibleState.Collapsed),
            ]);
        }
    }

    private _getWords(text: string): string[] {
        const result: string[] = [];
        [...text.matchAll(RegEx.Pattern.WORDS_AND_SEPARATORS)]
            .forEach(matches => result.push(...matches.slice(1).filter(s => s !== '')));

        return result;
    }

    private _countWords(text: string, windowSize: number): Map<string, number> {
        const freq = new Map<string, number>();
        const words = this._getWords(text);

        const addWord = (word: string) => {
            word = word.toLowerCase();
            let e = freq.get(word);
            freq.set(word, e ? 1 + e : 1);
        };

        for (let i = 0; i < words.length - windowSize; i++) {
            let word = words.slice(i, i + windowSize).join(' ');

            if (word.match(RegEx.Pattern.WORD_OR_MULTIWORD)) {
                addWord(word);
            }
        }

        return new Map([...freq.entries()].sort((a, b) => b[1] - a[1]));
    }


    private _getFrequencies(text: string, count: number): WordStatTreeItem[] {
        const result: WordStatTreeItem[] = [];
        const icon = undefined;

        const wf = this._countWords(text, count).forEach((value: number, key: string) => {
            result.push(new WordStatTreeItem(
                key,
                `${value}`,
                value,
                `"${key}" repeats ${value} time${value > 1 ? 's' : ''}`,
                icon,
                vscode.TreeItemCollapsibleState.None,
                'fictionWriter.views.wordFrequency.next.down'));
        });


        return result;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<WordStatTreeItem | undefined | null | void> = new vscode.EventEmitter<WordStatTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WordStatTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        if (!this._treeView?.visible) return;

        this._document = vscode.window.activeTextEditor?.document;
        if (this._treeView) {
            this._treeView.message = this._document?.fileName
                ? path.parse(this._document.uri.fsPath).base
                : '';
        }
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        if (this._treeView) {
            this._treeView.description = '';
        }
        this._document = undefined;
        this._onDidChangeTreeData.fire();
    }
}
