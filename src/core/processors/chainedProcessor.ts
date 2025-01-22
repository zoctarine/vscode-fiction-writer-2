import {IStateProcessor} from './IProcessor';
import {IFileState} from '../state';
import {log} from '../logging';

export class ChainedProcessor<T> implements IStateProcessor<T> {
	private _processors: IStateProcessor<T>[] = [];

	constructor() {
	}

	add(processor: IStateProcessor<T>): ChainedProcessor<T> {
		this._processors.push(processor);
		return this;
	}

	async run(state: T) {
		for (const processor of this._processors) {
			await processor.run(state);
		}
	}
}