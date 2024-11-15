import {IFwRef} from './IFwRef';
import {IFwMeta} from './IFwMeta';
import {IFwContent} from './IFwContent';

/**
 * Represents a file system item, that should be readonly.
 * The only time we set this values should be when a file is loaded from disc, or empty/placehodler
 * items are created
 */
export class FwFile {
    constructor(
        public readonly ref: IFwRef,
        public meta?: IFwMeta,
        public content?: IFwContent) {
    }
}
