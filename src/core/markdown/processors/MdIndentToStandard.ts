import {ITextProcessor} from './TextProcessors';
import {FwFormatting} from '../formatting';

/**
 * @obsolete
 */
export class MdIndentToStandard implements ITextProcessor {

	run(data?: string | undefined): string | undefined {
		if (!data) return data;

		const lines = data.split('\n');
		const result: string[] = [];
		for (let idx = 0; idx < lines.length; idx++) {
			let crt = lines[idx];
			// a paragraph;
			if (crt.match(/^( +|\t)/img) && crt.trim().length > 0) {
				if ((result.length > 1 &&
					!result[result.length-2].match(FwFormatting.Regex.NotAParagraph))) {
					result.push('');
				}
				result.push(crt.trimStart());
			} else {
				result.push(crt);
			}
		}
		return result.join('\n');
			// .replace(/^( +|\t).*\n{2,}(?=( +|\t))/gmi,
			// 	(match) => match.replace(/\n\n$/mi, '\n'));

		// return data
		// 	// duplicate empty lines, between paragraphs
		// 	// (explicitly having an empty line in an indented text means you want an empty line there)
		// 	.replace(/^([ \t]+).*\n/gm, (match) => {
		// 		return match + '\n';
		// 	})
		// 	// // convert hard breaks to paragraph breaks
		// 	// .replace(/^( +|\t).*\n(?=( +|\t))/gm, (match) => {
		// 	// 	return match + '\n';
		// 	// })
		// 	//Remove the indent from all indented lines
		// 	.replace(/^([ \t]+)/gm, '');
	}
}