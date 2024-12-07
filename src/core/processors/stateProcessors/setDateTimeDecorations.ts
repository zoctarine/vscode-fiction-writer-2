import {IStateProcessor} from '../IProcessor';
import {IDecorationState, IFileState} from '../../state';
import {FwControl, FwPermission, Permissions} from '../../fwFiles';
import {CoreColors} from '../../decorations';

export class SetDateTimeDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState) {
        const decorations: Partial<IDecorationState> =
            {
                description: `${state.fwItem?.info?.modified}`,
            };

        state.datetimeDecorations = {
            ...state.datetimeDecorations,
            ...decorations
        };
    }
}