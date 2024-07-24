import {
	schema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownSerializer,
	MarkdownSerializerState
} from "prosemirror-markdown";
import markdownIt from 'markdown-it';
import { Node, Mark } from "prosemirror-model";
import MarkdownIt from "markdown-it";
import type { PluginSimple } from "markdown-it";

function parseMultipleEmptyLines(md: markdownIt) {

	md.options.breaks = true;
	// Add a custom rule to handle line breaks as paragraphs

	var tmd = new MarkdownIt();
	md.block.tokenize = function (state, startLine, endLine) {
		state.skipEmptyLines = function (from) { return from; };
		var x = tmd.block.tokenize(state, startLine, endLine);
	};
}




const metadata_block: PluginSimple = (md) => {
	console.log(md.core.ruler);	
	md.core.ruler.before('block', 'metadata_block', (state) => {
		const lines = state.src.split("\n");
		
		lines.map(line =>{
			const pOpen = new state.Token("paragraph_open", "", 1);
			const pClose = new state.Token("paragraph_close", "", 1);
			const pInline = new state.Token("inline", "", 0);
			pOpen.children = [pInline];
			pInline.content = line;

			state.tokens.push(pOpen);
			state.tokens.push(pInline);
			state.tokens.push(pClose);

			console.log(line);
			return pOpen;
		});
		// const token = state.push('paragraph_open', '', 0);
		// token.markup = "\n";
		// token.content = state.getLines(startLine, endLine, 0, false);
		// state.line = startLine + endLine;

		// console.log("token", token.content);
		return true;
	});
	
};

defaultMarkdownParser.tokenizer.use(parseMultipleEmptyLines);

var customMarkdownSerializer: MarkdownSerializer = new MarkdownSerializer(
	{
		...defaultMarkdownSerializer.nodes,
		"paragraph": (state: MarkdownSerializerState, node: Node) => {
			state.renderInline(node);
			state.text('\n');
		},
	},
	defaultMarkdownSerializer.marks,
	defaultMarkdownSerializer.options);

export {
	defaultMarkdownParser as markdownParser,
	customMarkdownSerializer as markdownSerializer,
	schema
};