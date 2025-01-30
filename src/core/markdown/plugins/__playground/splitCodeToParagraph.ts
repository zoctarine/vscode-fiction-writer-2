import {visit} from 'unist-util-visit';

export function remarkSplitCodeToParagraphs() {
	function transformer(tree: any) {
		visit(tree, 'code', (node: any, index: any, parent: any) => {
			// Split code content by newlines
			const paragraphs = node.value.split(/[\n\r]/)
				.map((line: string, idx: number) => ({line, idx}))
				.filter(({line}: { line: string }) => line.trim().length > 0)
				.map(({line, idx}: { line: string, idx: number }) => {
					const lineIdx = node.position.start.line + idx;
					const columnStart = node.position.start.column;
					return {
						type: 'paragraph',
						position: {
							start: {
								line: lineIdx,
								column: columnStart,
							},
							end: {
								line: lineIdx,
								column: columnStart + line.length - 1,
							}
						},
						children: [{
							type: 'text',
							value: line,
							position: {
								start: {
									line: lineIdx,
									column: columnStart,
								},
								end: {
									line: lineIdx,
									column: columnStart + line.length - 1,
								}
							},
						}]
					};
				});

			// Replace the code node with multiple paragraph nodes
			parent.children.splice(index, 1, ...paragraphs);
		});

	}

	return transformer;
}