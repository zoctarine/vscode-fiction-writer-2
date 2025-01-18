import {visit} from 'unist-util-visit';

export function remarkDashes() {
	function transformer(tree: any) {
		visit(tree, 'root', (node: any) => {
			for (let i = 0; i < node.children.length; i++) {

				if (node.children[i].type === 'paragraph') {
					visit(node.children[i], 'text', (node: any) => {
						if (node.value?.startsWith('-- ')) {
							node.value = node.value.replace('-- ', '— ');
						}
						if (node.value) {
							node.value = node.value.replaceAll('\n-- ', '\n— ');
						}
					});
				}
			}
		});

	}

	return transformer;
}
