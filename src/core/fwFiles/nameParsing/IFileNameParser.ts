import {IFwFileRef} from '../IFwFileRef';

import {IFileNameOptions} from './IFileNameOptions';
import {IAsyncParser} from '../../lib';

export interface IFileNameParser extends IAsyncParser<string, IFileNameOptions, IFwFileRef> {
}

