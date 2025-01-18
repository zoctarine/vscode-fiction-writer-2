import {visit} from 'unist-util-visit';
import {Root} from 'mdast';
import {Plugin} from 'unified';
import {Extension} from "micromark-util-types";
import {codes} from 'micromark-util-symbol/lib/codes';

// // @ts-ignore
// const emptyLineExtension: Extension = {
// 	text: {
// 		[codes.ampersand]: {
// 			name: 'emptyLine',
// 			tokenize: (effects, ok, nok) => {
// 				// Handles newlines and determines if they're empty lines
// 				return function start(code) {
// 					if (code === 10) { // '\n' character
// 						effects.enter('emptyLine'); // Enter an emptyLine token
// 						effects.consume(code); // Consume the '\n' (newline)
// 						effects.exit('emptyLine'); // Exit the emptyLine token
// 						return ok; // Signal successful processing
// 					}
// 					return nok(code); // Otherwise, signal failure
// 				};
// 			}
// 		}
// 	},
// };


export const remarkKeepEmptyLines: Plugin = function () {
	const data = this.data();

	//data.micromarkExtensions?.push(emptyLineExtension);
};
// function transformer(tree: Root, file:string) {
// 	console.log(file);
// visit(tree, 'root', (node: any) => {
// 	for (let i = 0; i < node.children.length - 1; i++) {
// 		const current = node.children[i];
// 		const next = node.children[i + 1];
// 		if (current.position.end.line < next.position.start.line) {
// 			let numberOfEmptyLines = next.position.start.line - current.position.end.line;
// 			if (current.type === 'paragraph' && next.type === 'paragraph') {
// 				let diff = 2;
// 				let numberOfEmptyParagraphs = numberOfEmptyLines - diff;
// 				if (numberOfEmptyParagraphs > 0) {
// 					node.children.splice(i + 1, 0, {
// 						type: 'paragraph',
// 						children:[{
// 							type: 'text',
// 							value: '\n'.repeat(numberOfEmptyParagraphs),
// 						}]
// 					});
// 					i += 1;
// 				}
// 				// let collectedText = [];
// 				// for (let index = 0; index < numberOfEmptyParagraphs; index++) {
// 				// 	collectedText.push({
// 				// 		type: 'paragraph',
// 				// 		children: [{
// 				// 			type: 'text',
// 				// 			value: ''
// 				// 		}]
// 				// 	});
// 				// }
// 				//
// 				// node.children.splice(i + 1, 0, ...collectedText);
// 				// i += collectedText.length;
// 			}
// 		}
// 	}
// });
//
// 	}
//
// 	return transformer;
// }
