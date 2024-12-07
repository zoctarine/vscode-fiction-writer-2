import {IStateProcessor} from '../IProcessor';
import {applyDecorations, IDecorationState, IFileState} from '../../state';
import {FwControl, FwSubType} from '../../fwFiles';
import {log} from '../../logging';
import {CoreColors} from '../../decorations';

export class SetFwItemDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState){
        if (!state.fwItem) return;

        let newData: Partial<IDecorationState> = {};

        if (!state.fwItem.fsRef?.fsExists) {
            newData.color = CoreColors.missing;
            newData.highlightColor = CoreColors.missing;

        } else if (state.fwItem.info?.control === FwControl.Possible) {
            newData.color = CoreColors.inactive;
            newData.highlightColor = CoreColors.inactive;
            // TODO(A): suppressed by + command icon
            // newData.badge = '+';
        } else if (state.fwItem?.info?.subType === FwSubType.OtherFile) {
            newData.color = CoreColors.inactive;
            newData.highlightColor = CoreColors.inactive;
            newData.badge = '-';
        }

        state.decorations = applyDecorations(state.decorations, newData);

    }
}