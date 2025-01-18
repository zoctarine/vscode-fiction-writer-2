import {IStateProcessor} from '../IProcessor';
import {IDecorationState, IFileState} from '../../state';
import {FwControl, FwPermission, Permissions} from '../../fwFiles';
import {CoreColors} from '../../decorations';

export class SetOrderDecorations implements IStateProcessor<IFileState> {
	async process(state: IFileState) {
		const canSort = Permissions.check(state.fwItem?.info, FwPermission.Sort);

		const decorations: Partial<IDecorationState> = canSort
			? {
				description: ` ... ${state.fwItem?.info?.mainOrder.order?.slice(-1) ?? 0}`,
			}
			: {
				color: CoreColors.inactive,
			};

		state.orderDecorations = {
			...state.orderDecorations,
			...decorations
		};
	}
}