import {ITextProcessor} from '../IProcessor';

import {IFileState, IMetaState} from '../states';

export class InjectMetaIntoContent implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.metadata) return content;

        return `${data.metadata.markdownBlock}${content}`;
    }
}