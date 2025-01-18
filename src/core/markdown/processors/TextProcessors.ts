import {IProcessor, IStateProcessor} from '../../processors';

export interface ITextProcessor extends IProcessor<string, string | undefined> {

}


export class TextProcessor implements ITextProcessor {
	private _processors: ITextProcessor[] = [];

	constructor() {
	}

	process(data?: string | undefined): string | undefined {
		for (const processor of this._processors) {
			data = processor.process(data);
		}

		return data;
	}

	add(processor: ITextProcessor): TextProcessor {
		this._processors.push(processor);
		return this;
	}
}

export class MdIndentToStandard implements ITextProcessor {

	process(data?: string | undefined): string | undefined {
		if (!data) return data;

		return data
			// duplicate empty lines, between paragraphs
			// (explicitly having an empty line in an indented text means you want an empty line there)
			.replace(/^( +|\t).*\n\n(?=( +|\t))/gm, (match) => {
				return match + '\n';
			})
			// convert hard breaks to paragraph breaks
			.replace(/^( +|\t).*\n(?=( +|\t))/gm, (match) => {
				return match + '\n';
			})
			//Remove the indent from all indented lines
			.replace(/^( +|\t)/gm, '');
	}
}