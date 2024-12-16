import {IFsRef} from '../../IFsRef';

import {IAsyncParser, IParser} from '../../../lib';
import {IFwInfo} from '../../FwInfo';
import {Path} from 'glob';


export interface IFwInfoParser extends IParser<IFsRef, IFwInfo> {
}

export interface IFsRefParser extends IAsyncParser<Path, IFsRef> {
}