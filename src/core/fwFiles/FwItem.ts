import {FwEmptyInfo, FwInfo, FwRootInfo} from './FwInfo';
import {FsRefEmpty, IFsRef} from './IFsRef';
import {FsContentEmpty, IFsContent} from './IFsContent';

export class FwItem {
    constructor(public fsRef: IFsRef, public fsContent: IFsContent, public info: FwInfo,
                public parent: string | undefined = undefined,
                public children: string[] = []
                ) {
    }
}

export class FwItemEmpty extends FwItem {
    constructor() {
        super(new FsRefEmpty(), new FsContentEmpty(), new FwEmptyInfo());
    }
}


export class FwItemRoot extends FwItem {
    constructor() {
        super(new FsRefEmpty(), new FsContentEmpty(), new FwRootInfo());
    }
}

