import {visit} from 'unist-util-visit';

export function remarkDashes() {
	function transformer(tree: any) {
		visit(tree, 'root', (node: any) => {
			for (let i = 0; i < node.children.length; i++) {

				if (node.children[i].type === 'paragraph') {
					visit(node.children[i], 'text', (node: any) => {
						if (!node.value) return;

						node.value = node.value.replace(
							/^(\s*)(--|---) /m,
							(_: any, whitespace: string, dashes: string) => {
								return `${whitespace}— `;
							}
						);
					});
				}
			}
		});

	}

	return transformer;
}
