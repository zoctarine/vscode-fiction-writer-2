import { schema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownSerializer,
	MarkdownSerializerState
 } from "prosemirror-markdown";
import markdownIt from 'markdown-it';
import { Node, Mark } from "prosemirror-model";
import MarkdownIt from "markdown-it";




function parseMultipleEmptyLines(md:markdownIt) {
	
	const defaultBlockTokenize = md.block.tokenize;
var tmd = new MarkdownIt();

	md.block.tokenize = function (state, startLine, endLine) {
		state.skipEmptyLines = function (from) { return from;};

		return tmd.block.tokenize(state, startLine, endLine);
		console.log("DEFAULT", state.tokens);
		
	  // Split content by lines
	  const lines = state.src.split('\n');
		let emptyLines = 0;
	  // Create tokens for each line
	  for (let line = 0; line < lines.length; line++) {
		const content = lines[line].trim();
  console.log(content);
		if (content || emptyLines >=1) {
		  // Open paragraph token
		  let token = state.push('paragraph_open', 'p', 1);
		  token.map = [line, line + 1];
  
		  // Inline content token
		  token = state.push('inline', '', 0);
		  token.content = content;
		  token.map = [line, line + 1];
		  token.children = [];
  
		  // Close paragraph token
		  state.push('paragraph_close', 'p', -1);
		  emptyLines=0;
		} else {
		  // If the line is empty, we need to ensure it creates a new paragraph if the next line has content
		  state.line++;
		  emptyLines++;
		}
	  }
	  // Update the state line number
	  state.line = endLine;
	};
}

function renderMultipleEmptyLines(md:markdownIt) {
	const originalParagraphClose = md.renderer.rules.paragraph_close || function(tokens, idx, options, env, self) {
	  return self.renderToken(tokens, idx, options);
	};
  
	md.renderer.rules.paragraph_close = function (tokens, idx, options, env, self) {
	  let result = originalParagraphClose(tokens, idx, options, env, self);
  console.log(idx, tokens[idx].content);
	  // Add extra line breaks for empty paragraphs
	  if (tokens[idx].content.trim() === '') {
		result += '\n\n'; // Add two new lines for empty paragraphs
	  } else {
		result += '\n'; // Add a single new line for non-empty paragraphs
	  };
  
	  return result;
	};
  }

defaultMarkdownParser.tokenizer.use(parseMultipleEmptyLines);

// Extend the default serializers with custom behavior
const customMarkdownSerializer1:MarkdownSerializer = {
	nodes: {},
	marks: {},
	options: {
		escapeExtraCharacters: undefined,
		hardBreakNodeName: undefined,
		strict: undefined
	},
	serialize: function (content: Node, options?: { tightLists?: boolean; }): string {
		let result = "";
		console.log(content);
		
		for (let i = 0; i < content.childCount; i++) {
			const child = content.child(i);
			console.log(child);
			const fragment = defaultMarkdownSerializer.serialize(child);
			console.log(fragment);
			console.log(child.textContent);

			result += fragment;
			if (child.isBlock) {
				result += "\n\n";
			}
		}
		return result;
	}
};


var customMarkdownSerializer:MarkdownSerializer = new MarkdownSerializer(
	{
		...defaultMarkdownSerializer.nodes,
		"paragraph" :(state: MarkdownSerializerState, node: Node) =>{
			state.renderInline(node);
			state.write('\n\n');
		  },
	}, 
	defaultMarkdownSerializer.marks, 
	defaultMarkdownSerializer.options);

export {defaultMarkdownParser, customMarkdownSerializer, schema};