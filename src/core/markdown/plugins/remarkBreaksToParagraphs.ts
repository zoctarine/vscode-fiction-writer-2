import {visit} from 'unist-util-visit';
import {Root} from 'mdast';
import {Plugin} from 'unified';
import {codes, constants, types} from 'micromark-util-symbol';
import {Paragraph} from 'mdast';


const mdastBreaksToParagraphs = {
	transforms: [
		(tree: Root) => {
			visit(tree, 'paragraph', (node, index, parent) => {
				if (!parent || parent.type !== 'root' || index === undefined) return;

				for (let idx = 0; idx < node.children.length; idx++) {
					const crt = node.children[idx];

					if (crt.type === 'text' && crt.value) {

						// split text by first line break
						// the lines are already cleared from whitespace prefixes
						const regex = /(.*?)\r?\n([\s\S]*)/;
						const match = crt.value.match(regex);

						if (!match) continue;
						const [_, firstLine, allOtherLines] = match;

						crt.value = firstLine;
						let oldEnd = crt.position?.end.line ?? 1;
						if (crt.position) {
							const {start} = crt.position;
							crt.position.end = {
								line: start.line,
								column: start.column + firstLine.length,
								offset: (start.offset ?? 1) + firstLine.length,
							};
						}

						// Create the rest as a new paragraph node
						let lineIdx = crt.position?.end.line ?? 0;
						let nextParagraph: Paragraph = {
							type: 'paragraph',
							position: {
								start: {line: lineIdx, column: 1,},
								end: {line: oldEnd, column: allOtherLines.length,},
							},
							children: [{
								type: 'text',
								value: allOtherLines,
								position: {
									start: {line: lineIdx, column: 1,},
									end: {line: oldEnd, column: allOtherLines.length,},
								}
							}]
						};

						// Add the remaining children to the new paragraph and skip
						// processing to it

						const remainingChildren = node.children.splice(idx + 1);
						nextParagraph.children.push(...remainingChildren);

						parent.children.splice(index + 1, 0, nextParagraph);
						if (node.position && crt.position) node.position.end = crt.position.end;
						break;
					}
				}

			});
			return tree;
		}],
};

export const remarkBreaksToParagraphs: Plugin = function () {
	const data = this.data();

	data.micromarkExtensions ??= [];
	data.fromMarkdownExtensions ??= [];


	data.fromMarkdownExtensions.push(
		mdastBreaksToParagraphs
	);

	return (tree) => {
	};
}