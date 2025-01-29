import {Plugin, Settings} from 'unified';
// @ts-ignore
import {FlowChildren, FlowParents, State} from 'mdast-util-to-markdown/lib/types';
import {ITextProcessorContext} from '../processors';

function toMarkdownExtension() {
	return {
		join: [
			(left: FlowChildren, right: FlowChildren, parent: FlowParents, state: State) => {
				const diff = right.position?.start.line - left.position?.end.line;
				if (diff >= 2) {
					return diff-1;
				}
			}
		]
	};
}

export const remarkKeepAllEmptyLines: Plugin = function () {
	const data = this.data();

	const context = (data as any).context as ITextProcessorContext;

	if (context)
		context.keepEmptyLinesBetweenParagraphs = true;

	data.toMarkdownExtensions?.push(toMarkdownExtension());
};