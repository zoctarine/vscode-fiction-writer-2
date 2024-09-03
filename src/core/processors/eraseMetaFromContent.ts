import {ITextProcessor} from './IProcessor';
import {DynamicObj, RegEx} from '../index';
import {IFileState} from '../state/states';

export class EraseMetaFromContent implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        return content.replace(RegEx.Pattern.METADATA, '');
    }
}