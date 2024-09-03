import {ITextProcessor} from '../IProcessor';
import {DynamicObj, RegEx} from '../../index';
import {Metadata} from '../../metadata/metadata';

import {IFileState} from '../../state/states';

export class AlterState implements ITextProcessor<IFileState> {
    constructor(private _transformMeta: (crtState: IFileState) => IFileState) {
    }

    async process(content: string, state: IFileState): Promise<string> {
        const nextState = {...state, ...this._transformMeta(state)}
        Object.keys(nextState).forEach(key => {
            if (key in state) {
                (state[key as keyof IFileState] as any) = nextState[key as keyof IFileState];
            }
        });
        return content;
    }
}