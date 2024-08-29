import * as assert from 'assert';
import MarkdownIt from 'markdown-it';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as myExtension from '../../extension';

describe('Extension Test Suite', () => {

	test('Sample test', async () => {
		const md = new MarkdownIt({
			breaks: true
		});

		const inputMarkdown = `This is a paragraph.



This is another paragraph.`;
		const tmd = new MarkdownIt();
		md.block.tokenize = function (state, startLine, endLine) {
			state.skipEmptyLines = function (from) {
				return from;
			};
			tmd.block.tokenize(state, startLine, endLine);
		};
		md.core.ruler.before('block', 'multiline_paragraphs', function (state) {

			for (let blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
				let token = state.tokens[blkIdx];

				if (token.type !== 'inline') continue;
				if (!token.children || token.children.length === 0) continue;

				for (let i = token.children.length - 1; i >= 0; i--) {
					let child = token.children[i];
					if (child.type === 'text') {
						let fragments = child.content.split(/\n{2,}/);

						if (fragments.length > 1) {
							// Replace the current text token with multiple tokens to handle multiple empty lines
							let newTokens:any[] = [];
							fragments.forEach((fragment, idx) => {
								if (fragment) {
									newTokens.push({ ...child, content: fragment });
								}
								if (idx < fragments.length - 1) {
									// Add an empty paragraph
									newTokens.push(new state.Token('paragraph_open', 'p', 1));
									newTokens.push(new state.Token('inline', '', 0));
									newTokens.push(new state.Token('paragraph_close', 'p', -1));
								}
							});

							// Replace original child with new tokens
							token.children.splice(i, 1, ...newTokens);
						}
					}
				}
			}
		});
console.log(md.core.ruler.disable('text_join'));
console.log(md.core.ruler.disable('linkify'));
console.log(md.core.ruler.disable('replacements'));
console.log(md.core.ruler.disable('smartquotes'));
		const tokens = md.parse(inputMarkdown, {});
		console.log(md.render(inputMarkdown));
	});
});
