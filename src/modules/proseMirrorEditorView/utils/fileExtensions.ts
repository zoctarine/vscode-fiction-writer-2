import { textFileParser, textFileSerializer } from "./textfileExtensions";
import { markdownParser, markdownSerializer } from "./markdownExtensions";
export {schema} from "prosemirror-markdown";

const useMarkdown = true;
export const fileParser = useMarkdown ? markdownParser : textFileParser;
export const fileSerializer = useMarkdown ? markdownSerializer : textFileSerializer;
