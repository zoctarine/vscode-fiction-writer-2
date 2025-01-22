import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';

export class SetMetadata implements IStateProcessor<IFileState> {
	async run(state: IFileState) {
		if (!state.fwItem?.fsContent) return;

		// TODO: arrange meta in project specific way?
		//       filter out unknown stuff?
		state.metadata = state.fwItem.fsContent.meta?.value;
	}
}

