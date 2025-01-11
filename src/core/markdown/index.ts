import remarkStringify from 'remark-stringify';
import remarkParse from 'remark-parse';
import {unified} from 'unified';
import remarkFrontmatter from 'remark-frontmatter';
import {remarkExpandParagraphs} from './plugins/remarkExpandParagraphs';
import {remarkSplitCodeToParagraphs} from './plugins/splitCodeToParagraph';
import {remarkParagraphsToCodeBlock} from './plugins/mergeParagrapshToCode';
import {remarkDashes} from './plugins/remarkDashes';
import vscode, {Disposable, TextEdit} from 'vscode';
import {IFileState, StateManager} from '../state';
import {FwFormatOptions, FwFormatting, FwMarkdownFileFormat} from './formatting';

function fromCustomToStandard() {
    return unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(remarkDashes)
        .use(remarkExpandParagraphs)
        .use(remarkSplitCodeToParagraphs)
        .use(remarkStringify, {
            fences: false
        });
}

function fromStandardToCustom() {
    return unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ['yaml'])
        .use(() => (tree: any, file: any) => {
            file.data.matter = {cool: "stuff"};
        })
        .use(remarkDashes)
        .use(remarkExpandParagraphs)
        .use(remarkParagraphsToCodeBlock)
        .use(remarkStringify, {
            fences: false,
            // join: [(left:any, right:any, parent:any, state:any) => (left.type === 'paragraph' && right.type==='paragraph') ? 0 : 1]
        });
}

function applyProcessor(formatter: any) {
    if (vscode.window.activeTextEditor?.document) {
        let doc = vscode.window.activeTextEditor.document;
        const result = formatter.processSync(doc.getText()).toString();

        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            doc.uri,
            new vscode.Range(0, 0, doc.lineCount, 0),
            result);
        vscode.workspace.applyEdit(edit);
    }
}

function getProcessor(data?: string) {
    switch (data?.toLowerCase()) {
        case 'i':
        case 'indented':
            return fromStandardToCustom();
        default:
            return fromCustomToStandard();
    }
}
const formatStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

function updateStatusbar(state: IFileState | undefined){
    if (!state) {
        formatStatusBarItem.hide();
        return;
    }

    formatStatusBarItem.command = {
        arguments: [],
        command: 'fictionWriter.formatter.statusBar.indent.click',
        title: 'Select Formatter',
        tooltip: ''
    };
    const format = FwFormatOptions.get(state.fwItem?.fsContent.format);
    formatStatusBarItem.text = "$(symbol-text) " + format?.label;
    formatStatusBarItem.tooltip =  new vscode.MarkdownString(`**${format?.label}:** \n${format?.description}`);
    formatStatusBarItem.show();
}

export function registerMarkdownFormatters(stateManager: StateManager): vscode.Disposable {

    updateStatusbar(stateManager.get(vscode.window.activeTextEditor?.document?.uri?.fsPath));

    return Disposable.from(
        formatStatusBarItem,
        vscode.window.onDidChangeActiveTextEditor((editor) => {
           updateStatusbar(stateManager.get(editor?.document?.uri?.fsPath));
        }),
        vscode.commands.registerCommand("fictionWriter.formatter.convertToCustom", () => applyProcessor(fromStandardToCustom())),
        vscode.commands.registerCommand("fictionWriter.formatter.convertToStandard", () => applyProcessor(fromCustomToStandard())),
        vscode.commands.registerCommand("fictionWriter.formatter.statusBar.indent.click", async () => {
            const result = await vscode.window.showQuickPick([
                {
                    label: 'Indent', description: "Convert to custom indented format."
                },
                {
                    label: 'Standard', description: "Convert to custom MD format."
                },
                {
                    label: 'OneSentencePerLine', description: "Convert to 1 sentence per line variation"
                }
            ], {
                placeHolder: "Choose format",
            });

            applyProcessor(getProcessor(result?.label));
        }),

        vscode.languages.registerDocumentFormattingEditProvider('fwmarkdown', {

            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {

                let edits: vscode.TextEdit[] = [];
                const markdownContent = document.getText();

                try {
                    const result = getProcessor('i').processSync(markdownContent).toString();

                    edits.push(new vscode.TextEdit(
                        new vscode.Range(0, 0, document.lineCount, 0),
                        result));

                } catch (err) {
                    console.error(err);
                }
                return edits;
            }
        })
    );
}

