import {Plugin} from 'unified';
// @ts-ignore
import {FlowChildren, FlowParents, State} from 'mdast-util-to-markdown/lib/types';
import {visit} from 'unist-util-visit';
import {defaultHandlers} from "mdast-util-to-markdown";
import {ITextProcessorContext} from '../processors';

function toMarkdownParagraphAsHardBreaks(ctx?: ITextProcessorContext) {
	return {
		/**
		 * 1: line1
		 * 2: line2	(diff until line 2 is 2-1 = 1 => we keep 0 empty lines)
		 * 3:
		 * 4: line4 (diff until line 2 is 4-2 = 2 => we keep 0 empty lines)
		 * 5:
		 * 6:
		 * 7: line7 (diff until line 4 is 7-4 = 3 => we keep 2 empty lines)
		 */
		join: [
			(left: FlowChildren, right: FlowChildren, parent: FlowParents, state: State) => {
				if (left.type === 'paragraph' && right.type === 'paragraph' && right.position && left.position) {
					if (ctx?.keepEmptyLinesBetweenParagraphs === true) {
						const diff = right.position?.start.line - left.position?.end.line;

						return diff > 2 ? diff - 1 : Math.max(0, diff - 2);
					} else {
						return 0;
					}
				}
			}
		]
	};
}

export const remarkParagraphsAsBreaks: Plugin = function () {
	const data = this.data();

	const context = (data as any).context;
	data.toMarkdownExtensions?.push(toMarkdownParagraphAsHardBreaks(context));

	return (tree) => {

	};
};