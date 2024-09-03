import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state/states';

export class ComputeWriteTarget implements ITextProcessor<IFileState> {
    async process(content: string, data:IFileState): Promise<string> {
        if (!data.metadata?.value?.target) return content;
        if (!data.analysis?.statistics) return content;


        const wordCount = data.analysis.statistics.wordCount ?? 0;
        const target = parseInt(data.metadata.value.target, 10);
        if (isNaN(target)) {
            return content;
        }

        const percent = Math.round(wordCount * 100 / target);
        data.writeTargets ??= {};
        data.writeTargets = {
            ...data.writeTargets,
            wordsTarget: target,
            wordsTargetAchieved: percent,
            progress: `${wordCount}/${target} (${percent}%)`,
        };
        return content;
    }
}