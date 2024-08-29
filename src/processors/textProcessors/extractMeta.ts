import {ITextProcessor} from '../IProcessor';
import {RegEx} from '../../core';
import {Metadata} from '../metadata';

import {IMetaState} from '../states';

export class ExtractMeta implements ITextProcessor {
    async process(content: string, data: { metadata?: IMetaState }): Promise<string> {
        const matches = content.match(RegEx.Pattern.METADATA);
        data.metadata = matches
            ? {
                markdownBlock: matches[0],
                text: matches[2],
                value: Metadata.parse(matches[2] ?? ''),
            }
            : undefined;
        return content;
    }
}