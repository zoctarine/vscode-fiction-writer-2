import { TextAnalyzer} from '../../modules/textAnalysis/textAnalyzer';
import {ITextProcessor} from '../IProcessor';
import {ITextAnalyzerState} from '../states';

export class ComputeTextStatistics implements ITextProcessor {
    async process(content: string, data: {
        analysis?: ITextAnalyzerState,
    }): Promise<string> {
        const statistics = TextAnalyzer.analyze(content);

        data.analysis = {...data.analysis, statistics: statistics};
        return content;
    }
}