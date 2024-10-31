import {ITextProcessor} from './IProcessor';
import {IFileState} from '../state';
import {log} from '../logging';

export class ChainedTextProcessor implements ITextProcessor<IFileState> {
    private _processors: ITextProcessor<IFileState>[] = [];
    private _cacheKeys = new Map<ITextProcessor<IFileState>, string>();

    constructor() {
    }

    add(processor: ITextProcessor<IFileState>, snapshotKey?: string, snapshotOnly?: boolean): ChainedTextProcessor {
        this._processors.push(processor);
        if (snapshotKey) {
            this._cacheKeys.set(processor, snapshotKey);
        }
        return this;
    }

    async process(content: string, data: IFileState): Promise<string> {
        let lastContent = content;
        for (const processor of this._processors) {
            lastContent = await processor.process(lastContent, data);
        }
        return lastContent;
    }
}