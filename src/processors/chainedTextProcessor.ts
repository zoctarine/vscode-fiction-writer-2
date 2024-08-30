import {ITextProcessor} from './IProcessor';
import rfdc from 'rfdc';
import {IFileState, IFileStateSnapshot} from './states';

const clone = rfdc();

export class ChainedTextProcessor implements ITextProcessor<IFileState> {
    private _processors: ITextProcessor<IFileState>[] = [];
    private _cacheKeys = new Map<ITextProcessor<IFileState>, {key: string, snapshotOnly: boolean}>();
    private _snapshots = new Map<string, IFileStateSnapshot>();

    constructor() {
    }

    add(processor: ITextProcessor<IFileState>, snapshotKey?: string, snapshotOnly?: boolean): ChainedTextProcessor {
        this._processors.push(processor);
        if (snapshotKey) {
            this._cacheKeys.set(processor, {key: snapshotKey, snapshotOnly: snapshotOnly ?? false});
        }
        return this;
    }

    async process(content: string, data: IFileState): Promise<string> {
        let lastContent = content;
        this._snapshots.clear();
        for (const processor of this._processors) {
            const snapshot = this._cacheKeys.get(processor);
            if (snapshot) {
                let before = clone({...data});
                let after = clone({...data});

                if (snapshot.snapshotOnly){
                    lastContent = await processor.process(lastContent, after);
                } else {
                    lastContent = await processor.process(lastContent, data);
                    after = clone({...data});
                }
                this._snapshots.set(snapshot.key, {prevState: before, state: after});
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