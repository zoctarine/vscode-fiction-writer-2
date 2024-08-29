import {ITextProcessor} from '../IProcessor';

import {IMetaState} from '../states';

export class InjectMetaIntoContent implements ITextProcessor {
    async process(content: string, data: { metadata?: IMetaState }): Promise<string> {
        if (!data.metadata) return content;

        return `${data.metadata.markdownBlock}${content}`;
    }
}