import {ITextProcessor} from '../IProcessor';
import {IMetaState, IWriteTargetsState, ITextAnalyzerState} from '../states';

export class ComputeWriteTarget implements ITextProcessor {
    async process(content: string, data: {
        metadata?: IMetaState,
        targets?: IWriteTargetsState,
        analysis?: ITextAnalyzerState
    }): Promise<string> {
        if (!data.metadata?.value?.target) return content;
        if (!data.analysis?.statistics) return content;


        const wordCount = data.analysis.statistics.wordCount ?? 0;
        const target = parseInt(data.metadata.value.target, 10);
        if (isNaN(target)) {
            return content;
        }

        const percent = Math.round(wordCount * 100 / target);
        data.targets ??= {};
        data.targets = {
            ...data.targets,
            wordsTarget: target,
            wordsTargetAchieved: percent,
            progress: `${wordCount}/${target} (${percent}%)`,
        };
        return content;
    }
}