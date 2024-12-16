import {FwEmpty, FwInfo, FwRootItem} from './FwInfo';
import {FsRefEmpty, IFsRef} from './IFsRef';
import {FsContentEmpty, IFsContent} from './IFsContent';

export class FwItem {
    constructor(public fsRef: IFsRef, public fsContent: IFsContent, public info: FwInfo) {
    }

    public children: string[] = [];
    public parent: string | undefined = undefined;
}

export class FwItemEmpty extends FwItem {
    constructor() {
        super(new FsRefEmpty(), new FsContentEmpty(), new FwEmpty());
    }
}


export class FwItemRoot extends FwItem {
    constructor() {
        super(new FsRefEmpty(), new FsContentEmpty(), new FwRootItem());
    }
}

