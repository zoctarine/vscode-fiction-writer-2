import {IFsRef} from '../../IFsRef';

import {IAsyncParser} from '../../../lib';
import {IFwInfo} from '../../FwInfo';

export interface IFwFsPathParser extends IAsyncParser<string, any, IFsRef> {
}

export interface IFileNameParser extends IAsyncParser<IFsRef, any, IFwInfo> {
}