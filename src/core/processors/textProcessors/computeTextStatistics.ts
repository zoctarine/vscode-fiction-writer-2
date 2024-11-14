import {TextAnalyzer} from '../../../modules/textAnalysis/textAnalyzer';
import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwSubType, FwType} from '../../fwFiles';

export class ComputeTextStatistics implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (data.fwItem?.type === FwType.Folder && data.fwItem?.subType !== FwSubType.VirtualFolder)
            return content;

        const statistics = TextAnalyzer.analyze(content);

        data.analysis = {...data.analysis, statistics: statistics};
        return content;
    }
}