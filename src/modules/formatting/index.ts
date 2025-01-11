import vscode, {TextEdit, WorkspaceEdit} from 'vscode';
import {DisposeManager} from '../../core';
import {remark} from 'remark';
import remarkStringify from 'remark-stringify';
import remarkParse from 'remark-parse';
import {unified} from 'unified';
import remarkFrontmatter from 'remark-frontmatter';

// Custom plugin to indent all paragraphs and add newline after each paragraph
function convertHardParagraphsToIndented() {
    return (tree: any) => {
        visit(tree, 'text', (node: any) => {
            if (typeof node.value === 'string') {
                node.value = 'a';
            }
        });
    };
}

function printAllNodes() {
    return (tree: any) => {
        visitAll(tree, (node: any) => {
            console.log(node);
        });
    };
}

// Helper function to visit all nodes of a particular type in the AST
function visitAll(tree: any, visitor: any) {

    visitor(tree);

    if (tree.children) {
        tree.children.forEach((child: any) => {
            visitAll(child, visitor);
        });
    }
}

// Helper function to visit all nodes of a particular type in the AST
function visit(tree: any, type: any, visitor: any) {
    if (tree.type === type) {
        visitor(tree);
    }
    if (tree.children) {
        tree.children.forEach((child: any) => {
            visit(child, type, visitor);
        });
    }
}

class FormattingModule extends DisposeManager {
    constructor() {
        super();
    }

    register(): vscode.Disposable {
        this.manageDisposable();

        return vscode.Disposable.from(this);
    }
}


export const formattingModule = new FormattingModule();