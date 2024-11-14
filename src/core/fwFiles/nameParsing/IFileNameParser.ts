import {IFwRef} from '../IFwRef';

import {IFileNameOptions} from './IFileNameOptions';
import {IAsyncParser} from '../../lib';

export interface IFileNameParser extends IAsyncParser<string, IFileNameOptions, IFwRef> {
}

