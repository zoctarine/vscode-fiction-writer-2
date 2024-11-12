import {ITextProcessor} from '../IProcessor';
import {IDecorationState, IFileState} from '../../state';
import {FwControl} from '../../fwFiles';
import {FwSubType} from '../../fwFiles/fwSubType';
import {log} from '../../logging';
import {CoreColors} from '../../decorations';

export class SetFwItemDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.fwItem) return content;

        let newData: Partial<IDecorationState> = {};

        if (!data.fwItem.ref.fsExists) {
            newData.color = CoreColors.missing;
            newData.highlightColor = CoreColors.missing;

        } else if (data.fwItem.control === FwControl.Possible) {
            newData.color = CoreColors.inactive;
            newData.highlightColor = CoreColors.inactive;

            newData.badge = '+';
        } else if (data.fwItem.subType === FwSubType.OtherFile) {
            newData.color = CoreColors.inactive;
            newData.highlightColor = CoreColors.inactive;
            newData.badge = '-';
        }

        data.decorations = {
            ...data.decorations,
            ...newData
        };
        return content;
    }
}