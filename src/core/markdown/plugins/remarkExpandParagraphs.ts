import {visit} from 'unist-util-visit';



export function remarkExpandParagraphs() {
    function transformer(tree:any) {
        visit(tree, 'root', (node:any) => {
            for (let i = 0; i < node.children.length - 1; i++) {

                if (node.children[i].type === 'paragraph' && node.children[i + 1].type === 'paragraph') {
                    let numberOfEmptyLines = node.children[i+1].position.start.line - node.children[i].position.end.line;
                    let numberOfEmptyParagraphs = Math.floor((numberOfEmptyLines - 1) / 2);
                    if (numberOfEmptyParagraphs > 0) {
                        let collectedText = [];
                        for (let index = 0; index < numberOfEmptyParagraphs; index++) {
                            collectedText.push({
                                type: 'paragraph',
                                children: [{
                                    type: 'text',
                                    value: ''
                                }]
                            });
                        }

                        node.children.splice(i + 1, 0, ...collectedText);
                        i += collectedText.length;
                    }
                }
            }
        });

    }

    return transformer;
}
