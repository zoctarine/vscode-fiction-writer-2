import {IStateProcessor} from './index';
import {IFileState} from '../state';

export interface IStateProcessorFactory<TState> {
    crateStateProcessor: () => IStateProcessor<TState>;
    createAlterStateProcessor?: (alterState: (state: IFileState) => IFileState) => IStateProcessor<TState>;
    createUpdateMetaProcessor: (alterState: (prevMeta: any) => any) => IStateProcessor<TState>;
}