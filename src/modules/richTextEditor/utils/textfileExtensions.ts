import {
	schema
} from "prosemirror-markdown";

import { Node, Mark } from "prosemirror-model";

class TextFileParser {

	public parse(text: string): Node {
		var nodes: Node[] = [];
		try {
			text.split("\n").forEach((line) => {
				const marks: Mark[] = [];
				if (line.trim() !== "") {
					nodes.push(schema.nodes.paragraph.create(null, schema.text(line), marks));
				} else {
					nodes.push(schema.nodes.hard_break.create(null, schema.text("\n")));
				}
			});

			return schema.nodes.doc.create({}, nodes)!;
		} catch (ex) {
			throw ex;
		}
	};
}

class TextFileSerializer {
	public serialize(content?: Node): string {
		let result = "";
		content?.forEach(node => {
			result += node.textContent +
			node ? "" : "";

		});

		return result;
	}
}

export const textFileParser = new TextFileParser();
export const textFileSerializer = new TextFileSerializer();