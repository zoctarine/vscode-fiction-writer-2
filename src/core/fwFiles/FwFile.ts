import {IFwFileRef} from './IFwFileRef';
import {IFwMeta} from './IFwMeta';

export class FwFile {
    constructor(
        public ref: IFwFileRef,
        public meta?: IFwMeta) {
    }
}
