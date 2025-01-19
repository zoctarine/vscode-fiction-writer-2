import {Plugin} from 'unified';
import {FlowChildren, FlowParents, State} from 'mdast-util-to-markdown/lib/types';

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

	data.toMarkdownExtensions?.push(toMarkdownExtension());
};