import {IProcessor} from '../../processors';

export interface ITextProcessor extends IProcessor<string, string | undefined> {

}

export interface ITextProcessorOptions{
	onProcess: (result?: string) => void;
}

export class TextProcessor implements ITextProcessor {
	private _processors: {processor: ITextProcessor, options?:ITextProcessorOptions}[] = [];

	constructor() {
	}

	process(data?: string | undefined): string | undefined {
		for (const item of this._processors) {
			data = item.processor.process(data);
			if (item.options?.onProcess){
				item.options.onProcess(data);
			}
		}

		return data;
	}

	add(processor: ITextProcessor, options?: ITextProcessorOptions): TextProcessor {
		this._processors.push({processor, options});
		return this;
	}
}

