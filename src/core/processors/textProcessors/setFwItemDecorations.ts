import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwControl} from '../../fwFiles';

export class SetFwItemDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.fwItem) return content;
        if (data.fwItem.control === FwControl.Active) return content;

        data.decoration = {
            ...data.decoration,
            color:  'disabledForeground',
            description: "",
            badge: data.fwItem?.control === FwControl.Possible ? "+" : "-",
            highlightColor: undefined,
        };

        return content;
    }
}