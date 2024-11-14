import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwType} from '../../fwFiles';

export class SetTextStatisticsDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState) {
        if (!state.fwItem?.content?.stats) {
            return;
        }

        state.textStatisticsDecorations = {
            ...state.textStatisticsDecorations,
            description: `${state.fwItem?.content?.stats.wordCount} words`
        };
    }
}