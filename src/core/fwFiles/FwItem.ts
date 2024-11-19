import {FwInfo} from './FwInfo';
import {IFsRef} from './IFsRef';
import {IFsContent} from './IFsContent';

export class FwItem {
    fsRef: IFsRef | undefined;
    fsContent: IFsContent | undefined;

    constructor(public info: FwInfo | undefined) {
    }
}