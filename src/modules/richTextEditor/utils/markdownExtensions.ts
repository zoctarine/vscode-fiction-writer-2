import {
    schema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownSerializer,
    MarkdownSerializerState
} from "prosemirror-markdown";
import markdownIt from 'markdown-it';
import {Node} from "prosemirror-model";
import MarkdownIt from "markdown-it";

function parseMultipleEmptyLines(md: markdownIt) {
    const tmd = new MarkdownIt();
    md.block.tokenize = function (state, startLine, endLine) {
        state.skipEmptyLines = function (from) {
            return from;
        };
        tmd.block.tokenize(state, startLine, endLine);
    };
}

defaultMarkdownParser.tokenizer.use(parseMultipleEmptyLines);

const customMarkdownSerializer: MarkdownSerializer = new MarkdownSerializer(
    {
        ...defaultMarkdownSerializer.nodes,
        "paragraph": (state: MarkdownSerializerState, node: Node) => {
            state.renderInline(node);

            // we want to keep empty paragraphs, to match the parseMultipleEmptyLines rule
            if (node.textContent.trim() === ''){
                state.write("\n");
            }
            state.closeBlock(node);
        }
    },
    defaultMarkdownSerializer.marks,
    defaultMarkdownSerializer.options);

export {
    defaultMarkdownParser as markdownParser,
    customMarkdownSerializer as markdownSerializer,
    schema
};