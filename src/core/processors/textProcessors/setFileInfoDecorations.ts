import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwControl} from '../../fwFiles';

export class SetFileInfoDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.fileInfo) return content;
        if (data.fileInfo.control === FwControl.Active) return content;

        data.decoration = {
            ...data.decoration,
            color:  'disabledForeground',
            description: "",
            badge: "",
            highlightColor: undefined,
        };

        return content;
    }
}