import {ITextProcessor} from './TextProcessors';

/**
 * @obsolete Use the {@link remarkIndented} micromark plugin
 */
export class MdStandardToIndented implements ITextProcessor {

	run(data?: string | undefined): string | undefined {
		if (!data) return data;

		const lines = data.split('\n');
		const result: string[] = [];

		for (let idx = 0; idx < lines.length; idx++) {
			let crt = lines[idx];
			// not a paragraph;
			if (crt.match(/^(#|\* |_ |- |\*\* |---|\*\*\*)/img)) {
				result.push(crt);
				continue;
			}

			if (crt.trim().length === 0) {
				result.push(crt);
				continue;
			}

			result.push('\t' + crt);
		}
		return result.join('\n')
			.replace(/^( +|\t).*\n{2,}(?=( +|\t))/gmi,
				(match) => match.replace(/\n\n$/mi, '\n'));
	}
}