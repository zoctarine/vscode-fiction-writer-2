import {ITextProcessor} from './TextProcessors';

export class MdIndentToStandard implements ITextProcessor {

	process(data?: string | undefined): string | undefined {
		if (!data) return data;

		return data
			// duplicate empty lines, between paragraphs
			// (explicitly having an empty line in an indented text means you want an empty line there)
			.replace(/^([ \t]+).*\n{1,}(?=([ \t]+))/gm, (match) => {
				return match + '\n';
			})
			// // convert hard breaks to paragraph breaks
			// .replace(/^( +|\t).*\n(?=( +|\t))/gm, (match) => {
			// 	return match + '\n';
			// })
			//Remove the indent from all indented lines
			.replace(/^([ \t]+)/gm, '');
	}
}