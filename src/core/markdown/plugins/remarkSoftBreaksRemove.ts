import {findAndReplace} from 'mdast-util-find-and-replace';
import {Nodes, Break, Text} from 'mdast';

export function remarkSoftBreaksRemove(options: {
	remove: true
}) {
	return (tree: Nodes) => {
		findAndReplace(tree, [/\r?\n/g, replace]);
	};
}

function replace(): Text {
	return {type: 'text', value: ' '};
}