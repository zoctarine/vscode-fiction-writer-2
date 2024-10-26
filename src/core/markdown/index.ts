import remarkStringify from 'remark-stringify';
import remarkParse from 'remark-parse';
import {unified} from 'unified';
import remarkFrontmatter from 'remark-frontmatter';
import {remarkExpandParagraphs} from './plugins/remarkExpandParagraphs';
import {remarkSplitCodeToParagraphs} from './plugins/splitCodeToParagraph';
import {remarkParagraphsToCodeBlock} from './plugins/mergeParagrapshToCode';
import {remarkDashes} from './plugins/remarkDashes';
import vscode, {Disposable} from 'vscode';

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

function useProcessor(formatter: any){
    if (vscode.window.activeTextEditor?.document) {
        let doc = vscode.window.activeTextEditor.document;
        const result = formatter.processSync(doc.getText()).toString();
        console.log(result);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            doc.uri,
            new vscode.Range(0, 0, doc.lineCount, 0),
            result);
        vscode.workspace.applyEdit(edit);
    }
}
export function registerMarkdownFormatters(): vscode.Disposable{
    // create a new status bar item that we can now manage
    const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.command = "fictionWriter.formatter.convertToCustom";
    myStatusBarItem.text = "$(symbol-text) Indent";
    myStatusBarItem.tooltip = "Custom indented format.";
    myStatusBarItem.show();

    return Disposable.from(
        vscode.commands.registerCommand("fictionWriter.formatter.convertToCustom", ()=>useProcessor(fromStandardToCustom())),
        vscode.commands.registerCommand("fictionWriter.formatter.convertToStandard", ()=>useProcessor(fromCustomToStandard())),
    );
}

