import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';

export class ComputeNameSegments implements IStateProcessor<IFileState> {

    async process(state: IFileState) {
        if (!state.fwItem?.info) return;

        if (Array.isArray(state.fwItem.info.displayName)) {
            state.name = {
                order: state.fwItem.info.displayName[0],
                name: state.fwItem.info.displayName[1] + state.fwItem.info.displayName[2],
                ext: state.fwItem.info.displayName[3] + state.fwItem.fsRef.fsExt
            };
        } else {
            state.name = {
                order: '',
                name: state.fwItem.info.displayName,
                ext: ''
            };
        }
    }
}

