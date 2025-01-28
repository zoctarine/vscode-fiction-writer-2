import {visit} from 'unist-util-visit';
import {Root} from 'mdast';
import {Plugin} from 'unified';
import {codes, constants, types} from 'micromark-util-symbol';
import {Paragraph} from 'mdast';


export const remarkDisableCodeIndented: Plugin = function () {
	const data = this.data();

	data.micromarkExtensions ??= [];

	data.micromarkExtensions.push({
		disable: {null: [types.codeIndented]}
	});

	return (tree) => {
	};
}