import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state';

export class SetTextStatisticsDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.analysis?.statistics) {
            return content;
        }

        data.textStatisticsDecorations = {
            ...data.textStatisticsDecorations,
            description: `${data.analysis.statistics.wordCount} words`
        };


        return content;
    }
}