import rfdc from 'rfdc';
import {ITextProcessor} from './IProcessor';
import {IFileState, IFileStateSnapshot} from '../state';

const clone = rfdc();

export class ChainedTextProcessor implements ITextProcessor<IFileState> {
    private _processors: ITextProcessor<IFileState>[] = [];
    private _cacheKeys = new Map<ITextProcessor<IFileState>, string>();
    private _snapshots = new Map<string, IFileStateSnapshot>();

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
        this._snapshots.clear();
        for (const processor of this._processors) {
            const snapshotKey = this._cacheKeys.get(processor);
            if (snapshotKey) {
                let before = clone({...data});
                lastContent = await processor.process(lastContent, data);
                let after = clone({...data});
                this._snapshots.set(snapshotKey, {prevState: before, state: after});
            } else {
                lastContent = await processor.process(lastContent, data);
            }
        }
        return lastContent;
    }

    get snapshots() {
        return clone(this._snapshots);
    }
}