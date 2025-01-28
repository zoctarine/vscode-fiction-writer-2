import {Plugin, Settings} from 'unified';
// @ts-ignore
import {FlowChildren, FlowParents, State} from 'mdast-util-to-markdown/lib/types';
import {ITextProcessorContext} from '../processors';

function toMarkdownExtension() {
	return {
		join: [
			(left: FlowChildren, right: FlowChildren, parent: FlowParents, state: State) => {
			// TODO: check for specific types?
				// 	if (left. type === 'definition' && right. type === 'definition') {
				if (right.position && left.position) {
					const diff = right.position?.start.line - left.position?.end.line - 1;
					if (diff >= 0) {
						return diff;
					}
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