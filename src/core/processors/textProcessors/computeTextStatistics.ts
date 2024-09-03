import { TextAnalyzer} from '../../../modules/textAnalysis/textAnalyzer';
import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state/states';

export class ComputeTextStatistics implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        const statistics = TextAnalyzer.analyze(content);

        data.analysis = {...data.analysis, statistics: statistics};
        return content;
    }
}