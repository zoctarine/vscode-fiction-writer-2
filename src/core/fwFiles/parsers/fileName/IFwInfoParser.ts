import {IFsRef} from '../../IFsRef';

import {IAsyncParser} from '../../../lib';
import {IFwInfo} from '../../FwInfo';
import {Path} from 'glob';


export interface IFwInfoParser extends IAsyncParser<IFsRef, any, IFwInfo> {
}

export interface IFsRefParser extends IAsyncParser<Path, any, IFsRef> {
}