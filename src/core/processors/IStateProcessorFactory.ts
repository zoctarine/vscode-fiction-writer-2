import {IStateProcessor} from './index';
import {IFileState} from '../state';

export interface IStateProcessorFactory<TState> {
    crateStateProcessor: () => IStateProcessor<TState>;
}