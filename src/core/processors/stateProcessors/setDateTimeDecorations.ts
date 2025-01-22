import {IStateProcessor} from '../IProcessor';
import {IDecorationState, IFileState} from '../../state';
import {FwControl, FwPermission, Permissions} from '../../fwFiles';
import {CoreColors} from '../../decorations';

export class SetDateTimeDecorations implements IStateProcessor<IFileState> {
	async run(state: IFileState) {
		const decorations: Partial<IDecorationState> =
			{
				description: `${new Date(state.fwItem?.fsRef?.fsModifiedDate ?? 0).toLocaleString()}`,
			};

		state.datetimeDecorations = {
			...state.datetimeDecorations,
			...decorations
		};
	}
}