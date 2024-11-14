import {IFwFileRef} from './IFwFileRef';
import {IFwMeta} from './IFwMeta';
import {IFwContent} from './IFwContent';

export class FwFile {
    constructor(
        public readonly ref: IFwFileRef,
        public readonly meta?: IFwMeta,
        public readonly content?: IFwContent) {
    }
}
