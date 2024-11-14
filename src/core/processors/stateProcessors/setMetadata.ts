import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';

export class SetMetadata implements IStateProcessor<IFileState> {
    async process(state: IFileState) {
        if (!state.fwItem?.meta) return;

        // TODO: arrange meta in project specific way?
        //       filter out unknown stuff?
        state.metadata = state.fwItem.meta.value;
    }
}

