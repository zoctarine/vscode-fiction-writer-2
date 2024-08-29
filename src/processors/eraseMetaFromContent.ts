import {ITextProcessor} from './IProcessor';
import {DynamicObj, RegEx} from '../core';

export class EraseMetaFromContent implements ITextProcessor {
    async process(content: string, data: DynamicObj): Promise<string> {
        return content.replace(RegEx.Pattern.METADATA, '');
    }
}