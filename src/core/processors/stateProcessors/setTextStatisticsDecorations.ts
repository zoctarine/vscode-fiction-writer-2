import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';

export class SetTextStatisticsDecorations implements IStateProcessor<IFileState> {
	async run(state: IFileState) {
		if (!state.fwItem?.fsContent?.stats) {
			return;
		}

		state.textStatisticsDecorations = {
			...state.textStatisticsDecorations,
			description: `${state.fwItem?.fsContent.stats.wordCount} words`
		};
	}
}