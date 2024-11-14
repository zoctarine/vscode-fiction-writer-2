import {IStateProcessor} from '../IProcessor';
import {IDecorationState, IFileState} from '../../state';
import {FwControl, FwSubType} from '../../fwFiles';
import {log} from '../../logging';
import {CoreColors} from '../../decorations';

export class SetFwItemDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState){
        if (!state.fwItem) return;

        let newData: Partial<IDecorationState> = {};

        if (!state.fwItem.ref.fsExists) {
            newData.color = CoreColors.missing;
            newData.highlightColor = CoreColors.missing;

        } else if (state.fwItem.control === FwControl.Possible) {
            newData.color = CoreColors.inactive;
            newData.highlightColor = CoreColors.inactive;

            newData.badge = '+';
        } else if (state.fwItem.subType === FwSubType.OtherFile) {
            newData.color = CoreColors.inactive;
            newData.highlightColor = CoreColors.inactive;
            newData.badge = '-';
        }

        state.decorations = {
            ...state.decorations,
            ...newData
        };
    }
}