import {DynamicObj} from '../core';

export interface IProcessor<T> {
    process(content: T, data: DynamicObj): Promise<T>
}

export interface ITextProcessor extends IProcessor<string> {

}