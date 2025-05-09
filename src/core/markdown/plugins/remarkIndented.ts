import {Plugin} from 'unified';
// @ts-ignore
import {FlowChildren, FlowParents, State} from 'mdast-util-to-markdown/lib/types';
import {visit} from 'unist-util-visit';
import {defaultHandlers} from "mdast-util-to-markdown";
import {ITextProcessorContext} from '../processors';

function toMarkdownExtension(ctx?: ITextProcessorContext) {
	return {
		handlers: {
			paragraph(node: any, parent: any, context: any, info: any) {
				const value = defaultHandlers.paragraph(node, parent, context, info);

				return (parent?.type === 'root' && !value.match(/^\s/im))
					? `\t${value}`
					: value;
			},
		},
		join: [
			(left: FlowChildren, right: FlowChildren, parent: FlowParents, state: State) => {
				if (left.type === 'paragraph' && right.type === 'paragraph' && right.position && left.position) {
					if (ctx?.keepEmptyLinesBetweenParagraphs === true) {
						const diff = right.position?.start.line - left.position?.end.line;
						if (diff > 3) {
							return diff - 1;
						} else {
							return diff - 2;
						}
					} else {
						return 0;
					}

				}
			}
		]
	};
}

export const remarkIndented: Plugin = function () {
	const data = this.data();

	const context = (data as any).context;

	data.toMarkdownExtensions?.push(toMarkdownExtension(context));

	return (tree) => {

	};
};