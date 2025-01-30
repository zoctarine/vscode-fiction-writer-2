import {visit} from 'unist-util-visit';

/**
 * @obsolete
  */
export function remarkParagraphsToCodeBlock() {
	function transformer(tree: any) {
		let next: any[] = [];

		visit(tree, 'root', (node: any) => {
			let collectedText: string[] = [];

			for (let i = 0; i < node.children.length; i++) {
				if ((node.children[i].type === 'paragraph')) {
					collectedText.push(node.children[i].children.map((child: any) => child.value).join(''));
				} else {
					addCodeBlock(next, collectedText);
					next.push(node.children[i]);
					collectedText = [];
				}
			}
			addCodeBlock(next, collectedText);
		});

		tree.children = next;
	}

	function addCodeBlock(next: any[], collectedText: string[]) {
		if (collectedText.length > 0) {
			const codeNode = {
				type: 'code',
				value: collectedText.join('\n')
			};
			next.push(codeNode);
		}
	}

	return transformer;
}

