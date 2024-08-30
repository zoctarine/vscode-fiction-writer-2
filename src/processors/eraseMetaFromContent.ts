import {ITextProcessor} from './IProcessor';
import {DynamicObj, RegEx} from '../core';
import {IFileState} from './states';

export class EraseMetaFromContent implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        return content.replace(RegEx.Pattern.METADATA, '');
    }
}