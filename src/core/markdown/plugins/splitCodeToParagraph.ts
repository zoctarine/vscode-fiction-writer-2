import {visit} from 'unist-util-visit';

export function remarkSplitCodeToParagraphs() {
    function transformer(tree:any) {
        visit(tree, 'code', (node:any, index:any, parent:any) => {
            // Split code content by newlines
            const paragraphs = node.value.split(/\n/).map((line:string) => {
                return {
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        value: line
                    }]
                };
            });

            // Replace the code node with multiple paragraph nodes
            parent.children.splice(index, 1, ...paragraphs);
        });

    }

    return transformer;
}

export function remarkMergeParagraphToCode() {
    function transformer(tree:any) {
        visit(tree, 'code', (node:any, index:any, parent:any) => {
            // Split code content by newlines
            const paragraphs = node.value.split(/\n/).map((line:string) => {
                return {
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        value: line
                    }]
                };
            });

            // Replace the code node with multiple paragraph nodes
            parent.children.splice(index, 1, ...paragraphs);
        });

    }

    return transformer;
}