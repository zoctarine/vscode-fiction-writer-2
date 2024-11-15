import {IStateProcessor} from '../IProcessor';
import {IDecorationState, IFileState} from '../../state';
import {FwPermission, Permissions} from '../../fwFiles';
import {CoreColors} from '../../decorations';

export class SetOrderDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState) {
        const canSort = Permissions.check(state.fwItem?.ref, FwPermission.Sort);

        const decorations: Partial<IDecorationState> = canSort
            ? {
                description: ` `
            }
            : {
                color: CoreColors.inactive
            };

        state.orderDecorations = {
            ...state.orderDecorations,
            ...decorations
        };
    }
}