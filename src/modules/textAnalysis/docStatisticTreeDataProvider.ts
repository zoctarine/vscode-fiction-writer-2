import * as vscode from 'vscode';
import {WordStatTreeItem} from './wordStatTreeItem';
import {DisposeManager, RegEx} from '../../core';
import {StateManager} from '../../core/stateManager';
import path from 'path';

const STD_CHAR_PER_WORD = 6;
const STD_WORD_PER_LINE = 10;
const STD_LINES_PER_PAGE = 24;
const STD_WORDS_PER_MINUTE = 200;

const count = (text: string, pattern: RegExp) => {
    return ((text || '').match(pattern) || []).length;
};

export class DocStatisticTreeDataProvider extends DisposeManager implements vscode.TreeDataProvider<WordStatTreeItem> {
    private _document: vscode.TextDocument | undefined;
    private _treeView: vscode.TreeView<WordStatTreeItem> | undefined;

    constructor(private readonly _stateManager: StateManager) {
        super();

        this._treeView = vscode.window.createTreeView('fictionWriter.views.statistics', {treeDataProvider: this});

        this.manageDisposable(
            this._treeView,
            this._treeView.onDidChangeVisibility((e) => {
                if (e.visible) {
                    this.refresh();
                }
            })
        );
    }

    getTreeItem(element: WordStatTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: WordStatTreeItem): Thenable<WordStatTreeItem[]> {
        if (!this._document) {
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve([]);
        } else {
            const rawText = this._document.getText();
            const text = rawText.replace(RegEx.Pattern.METADATA_BLOCK, '');
            const wordCount = count(text, RegEx.Pattern.WHOLE_WORD);
            const charCount = count(text, RegEx.Pattern.ANY_CHARACTER_ESCEPT_NEWLINE);
            const charCountNoSpaces = count(text, RegEx.Pattern.ANY_CHARACTER_EXCEPT_WHITESPACE);
            const estWordCount = Math.ceil(charCount / STD_CHAR_PER_WORD);
            const estLines = Math.ceil(estWordCount / STD_WORD_PER_LINE);
            const estPages = Math.ceil(estLines / STD_LINES_PER_PAGE);
            const estReadTime = wordCount / STD_WORDS_PER_MINUTE;
            const estReadTimeMin = Math.floor(estReadTime);
            const estReadTimeSec = Math.round(60 * (estReadTime - estReadTimeMin));

            const asString = (n: number) => `${n}`;

            return Promise.resolve([
                new WordStatTreeItem(asString(wordCount), 'Words', 1, 'Word Count', new vscode.ThemeIcon('whole-word')),
                new WordStatTreeItem(asString(charCountNoSpaces), 'Characters (exluding spaces)', 3, 'Character excluding spaces', new vscode.ThemeIcon('symbol-key')),
                new WordStatTreeItem(asString(charCount), 'Characters (including spaces)', 2, 'Characters including spaces', new vscode.ThemeIcon('whitespace')),
                new WordStatTreeItem(asString(estPages), 'Est. Pages', 4, 'At 24 lines per page', new vscode.ThemeIcon('files')),
                new WordStatTreeItem(asString(estLines), 'Est. Lines', 4, 'At 10 words per line', new vscode.ThemeIcon('word-wrap')),
                new WordStatTreeItem(asString(estWordCount), 'Est. Word Count', 4, 'At 6 characters per word', new vscode.ThemeIcon('zap')),
                new WordStatTreeItem(`${estReadTimeMin} min, ${estReadTimeSec} sec`, 'Est. Reading Time', 4, 'At 200 wpm', new vscode.ThemeIcon('eye')),
            ]);
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<WordStatTreeItem | undefined | null | void> = new vscode.EventEmitter<WordStatTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WordStatTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        if (!this._treeView?.visible) return;

        this._document = vscode.window.activeTextEditor?.document;

        this._treeView.message = this._document?.fileName
            ? path.parse(this._document.uri.fsPath).base
            : '';
        this._onDidChangeTreeData.fire();
    }

    clear(): void {
        this._document = undefined;
        this._onDidChangeTreeData.fire();
    }
}
