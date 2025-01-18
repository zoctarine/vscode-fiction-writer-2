import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state/states';

export class ComputeWriteTarget implements IStateProcessor<IFileState> {
	async process(state: IFileState) {
		if (!state.metadata?.target) return;
		if (!state.fwItem?.fsContent?.stats) return;

		const wordCount = state.fwItem.fsContent.stats.wordCount ?? 0;
		const target = parseInt(state.metadata.target, 10);

		if (isNaN(target)) {
			return;
		}

		const percent = Math.round(wordCount * 100 / target);
		state.writeTargets ??= {};
		state.writeTargets = {
			...state.writeTargets,
			wordsTarget: target,
			wordsTargetAchieved: percent,
			progress: `${wordCount}/${target} (${percent}%)`,
		};
	}
}