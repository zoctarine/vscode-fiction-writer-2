import {IFwRef} from './IFwRef';
import {FwSubType} from './FwSubType';
import path from 'path';
import {FwType} from './FwType';
import {FwControl} from './FwControl';
import {EmptyFwOrderedName, IFwOrderedName} from './IFwOrderedName';
import {DefaultOrderParser} from './parsers';

export interface IFwProjectRef extends IFwRef {
    type: FwType;
    subType: FwSubType;
    control: FwControl;

    currentOrder: number;
    parentOrder: number[];
    orderBy: string;
}

/**
 * The FwItem class represents a disk resource handled by FictionWriter
 */
export class FwRef implements IFwProjectRef {
    public type: FwType = FwType.Unknown;
    public subType: FwSubType = FwSubType.Unknown;
    public control: FwControl = FwControl.Unknown;

    public currentOrder: number = 0;
    public parentOrder: number[] = [];
    public orderBy: string = '';

    order?: number[] | undefined = [];
    orderString?: string | undefined = '';
    orderedName: string = '';
    name: IFwOrderedName = {
        namePart: '',
        orderPart: '',
        mainOrder: undefined,
        otherOrders: [],
        full: '',
    };
    projectTag: string;
    data: string[] = [];
    ext: string = '';
    fsExt: string = '';
    fsName: string = '';
    fsDir: string = '';
    fsPath: string = '';
    fsIsFile: boolean = false;
    fsIsFolder: boolean = false;
    fsExists: boolean = false;

    constructor(readonly ref: IFwRef) {
        this.data = ref.data;
        this.ext = ref.ext;
        this.fsDir = ref.fsDir;
        this.fsExt = ref.fsExt;
        this.fsName = ref.fsName;
        this.fsPath = ref.fsPath;
        this.name = ref.name;
        this.projectTag = ref.projectTag;
        this.fsIsFile = ref.fsIsFile;
        this.fsIsFolder = ref.fsIsFolder;
        this.fsExists = ref.fsExists;
    }


}

export class FwRootItem extends FwRef {
    constructor() {
        super({
            data: [],
            ext: '',
            fsDir: '',
            fsExt: '',
            fsName: '',
            fsPath: '',
            name: {
                full: 'root',
                namePart: 'root',
                orderPart: undefined,
                mainOrder: undefined,
                otherOrders: undefined
            },
            projectTag: '',
            fsIsFile: false,
            fsIsFolder: true,
            fsExists: false
        });
        this.type = FwType.Folder;
        this.subType = FwSubType.Root;
        this.control = FwControl.Never;
    }
}

export class FwVirtualFolderItem extends FwRef {
    constructor(ref: IFwRef) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.VirtualFolder;
        this.control = FwControl.Active;
    }
}

export class FwEmptyVirtualFolder extends FwRef {
    constructor(ref: IFwRef) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.EmptyVirtualFolder;
        this.control = FwControl.Active;
    }

    public static create(parent: IFwProjectRef | undefined, order: number): FwEmptyVirtualFolder {
        // TODO: inject provider
        const x = new DefaultOrderParser();
        const name: IFwOrderedName = x.build({
            order: order,
            otherOrders: [...parent?.name?.otherOrders ?? [], order].filter(o => o > 0),
            name: 'empty'
        });
        const projectTag = 'fw';
        const fsExt = '.md';
        const ext = `.${projectTag}${fsExt}`;
        const fsName = `${name.full}${ext}`;
        const fsPath = path.posix.join(parent?.fsPath ?? '', fsName);
        const result = new FwEmptyVirtualFolder({
            data: [],
            ext,
            fsDir: parent?.fsDir ?? '',
            fsExt,
            fsName,
            fsPath,
            name,
            projectTag,
            fsIsFolder: false,
            fsIsFile: true,
            fsExists: false
        });

        result.currentOrder = order;
        result.parentOrder = parent?.parentOrder ?? [];
        result.orderBy = `${result.name.full}`;

        return result;
    }
}

export class FwEmpty extends FwRef {
    constructor() {
        super({
            data: [], ext: '', fsDir: '', fsExt: '', fsName: '', fsPath: '',
            name: EmptyFwOrderedName,
            projectTag: '', fsExists: false,
            fsIsFolder: false, fsIsFile: true
        });
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwFolderItem extends FwRef {
    constructor(ref: IFwRef) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwWorkspaceFolderItem extends FwRef {
    constructor(ref: IFwRef) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.WorkspaceFolder;
        this.control = FwControl.Never;
    }
}

export class FwProjectFileItem extends FwRef {
    constructor(ref: IFwRef) {
        super(ref);
        this.type = FwType.File;
        this.subType = FwSubType.ProjectFile;
        this.control = FwControl.Active;
    }
}

export class FwTextFileItem extends FwRef {
    constructor(ref: IFwRef) {
        super(ref);
        this.type = FwType.File;
        this.subType = FwSubType.TextFile;
        this.control = FwControl.Possible;
    }
}

export class FwOtherFileItem extends FwRef {
    constructor(ref: IFwRef) {
        super(ref);
        this.type = FwType.File;
        this.subType = FwSubType.OtherFile;
        this.control = FwControl.Never;
    }
}

