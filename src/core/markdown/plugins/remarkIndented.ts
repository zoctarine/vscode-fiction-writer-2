import {Plugin} from 'unified';
import {FlowChildren, FlowParents, State} from 'mdast-util-to-markdown/lib/types';
import {visit} from 'unist-util-visit';
import {defaultHandlers} from "mdast-util-to-markdown";

function toMarkdownExtension(options?: IRemarkPluginOptions) {
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
					return options?.keepEmptyLinesBetweenParagraphs === true
						?  Math.max(0, right.position?.start.line - left.position?.end.line - 2)
						: 0;
				}
			}
		]
	};
}

export interface IRemarkPluginOptions {
	keepEmptyLinesBetweenParagraphs: boolean;
}
export const remarkIndented: Plugin<IRemarkPluginOptions[]> = function (options?: IRemarkPluginOptions) {
	const data = this.data();

	data.toMarkdownExtensions?.push(toMarkdownExtension(options));

	return (tree) => {
		visit(tree, 'code', (node: any, index:any, parent:any) => {
			// if (node.children.length > 0 && parent === tree){
			// 	node.children[0].value = FormatTokens.PARAGRAPH_INDENT + node.children[0].value;
			// }
		});
	};
};