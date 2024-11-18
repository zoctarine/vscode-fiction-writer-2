import {IFwMeta} from './IFwMeta';
import {IFwContent} from './IFwContent';
import {FwType} from './FwType';
import {FwSubType} from './FwSubType';
import {FwControl} from './FwControl';
import {IFwRef} from './IFwRef';
import {IFwProjectRef} from './FwRef';

/**
 * Represents a file system item, that should be readonly.
 * The only time we set this values should be when a file is loaded from disc, or empty/placehodler
 * items are created
 */
export class FwItem {
    constructor(
        public readonly ref: IFwProjectRef,
        public meta?: IFwMeta,
        public content?: IFwContent) {
    }

    public type: FwType = FwType.Unknown;
    public subType: FwSubType = FwSubType.Unknown;
    public control: FwControl = FwControl.Unknown;
}
