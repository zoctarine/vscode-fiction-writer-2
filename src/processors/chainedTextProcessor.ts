import {DynamicObj} from '../core';
import {ITextProcessor} from './IProcessor';

export enum StateLifetime {
    OverwriteOnUpdate,
    PersistBetweenUpdates
}
export class ChainedTextProcessor implements ITextProcessor {
    private _processors: ITextProcessor[] = [];

    constructor() {
    }

    add(processor: ITextProcessor, lifetime: StateLifetime = StateLifetime.OverwriteOnUpdate): ChainedTextProcessor {
        this._processors.push(processor);
        return this;
    }

    async process(content: string, data: DynamicObj): Promise<string> {
        let lastContent = content;

        for (const processor of this._processors) {
            lastContent = await processor.process(lastContent, data);
        }

        return lastContent;
    }
}