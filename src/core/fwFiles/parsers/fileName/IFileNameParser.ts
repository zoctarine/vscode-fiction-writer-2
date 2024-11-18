import {IFwRef} from '../../IFwRef';

import {IAsyncParser, IBuilder} from '../../../lib';

export interface IFileNameParser extends IAsyncParser<string, any, IFwRef> {
}

export interface IFileNameBuilder<T> extends IBuilder<T, IFwRef>{

}
export interface IFileNameInput{
    name?: string;
    isFile: boolean;
    dir: string;
}

export interface IFileNameProcessor extends IFileNameParser, IFileNameBuilder<IFileNameInput>{

}