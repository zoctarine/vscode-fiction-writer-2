import {findAndReplace} from 'mdast-util-find-and-replace';
import {Nodes, Break, Text} from 'mdast';

export function remarkSoftBreaks(options: {
	remove: true
}) {
	const replaceFunc = options.remove ? replace : escape;
	return (tree: Nodes) => {
		findAndReplace(tree, [/\r?\n/g, replaceFunc]);
	};
}

function replace(): Text {
	return {type: 'text', value: ' '};
}

function escape(): Break {
	return {type: 'break'};
}