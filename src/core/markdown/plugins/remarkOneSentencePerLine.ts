import {Plugin} from 'unified';
import {defaultHandlers} from "mdast-util-to-markdown";
import {findAndReplace} from 'mdast-util-find-and-replace';
import {Break, Nodes, PhrasingContent, Text} from 'mdast';

function toMarkdownExtension(options?: IRemarkPluginOptions) {
	return {
		handlers: {
			break(node: Break, parent: any, context: any, info: any) {
				const value = defaultHandlers.break(node, parent, context, info);

				return ((node.data as any).ospl)
					? `\n`
					: value;
			},
		}
	};
}

export interface IRemarkPluginOptions {
	keepEmptyLinesBetweenParagraphs: boolean;
}
export const remarkOneSentencePerLine: Plugin<IRemarkPluginOptions[]> = function (options?: IRemarkPluginOptions) {
	const data = this.data();

	data.toMarkdownExtensions?.push(toMarkdownExtension(options));

	return (tree:any) => {
		findAndReplace(tree as Nodes, [/[.;?!]( +)/g, replace]);
	};
};


function replace(match: string): [PhrasingContent,PhrasingContent] {
	return [
		{type: 'text', value:match.trimEnd()},
		{type: 'break', data:{ospl: true}}
	];
}