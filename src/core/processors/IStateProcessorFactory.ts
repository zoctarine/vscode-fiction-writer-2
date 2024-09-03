import {ITextProcessor} from './index';
import {IFileState} from '../state';

export interface IStateProcessorFactory<TState> {
    createTextProcessor: () => ITextProcessor<TState>;
    createAlterStateProcessor?: (alterState: (state: IFileState) => IFileState) => ITextProcessor<TState>;
    createUpdateMetaProcessor: (alterState: (prevMeta: any) => any) => ITextProcessor<TState>;
}