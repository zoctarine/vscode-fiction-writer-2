import {IFwFile} from './IFwFile';
import {FwSubType} from './fwSubType';
import path from 'path';
import {FwType} from './fwType';
import {FwControl} from './fwControl';
import {FwPermission} from './fwPermission';


/**
 * The FwItem class represents a disk resource handled by FictionWriter
 *
 */
export class FwItem {
    public type: FwType = FwType.Unknown;
    public subType: FwSubType = FwSubType.Unknown;
    public control: FwControl = FwControl.Unknown;

    public order: number = 0;
    public parentOrder: number[] = [];
    public orderBy: string = '';

    constructor(public readonly ref: IFwFile) {
    }
}

export class FwRootItem extends FwItem {
    constructor() {
        super({
            data: [],
            ext: '',
            fsDir: '',
            fsExt: '',
            fsName: '',
            fsPath: '',
            name: 'root',
            order: [],
            orderedName: '',
            orderString: '',
            projectTag: '',
            fsExists: false
        });
        this.type = FwType.Folder;
        this.subType = FwSubType.Root;
        this.control = FwControl.Never;
    }
}

export class FwVirtualFolderItem extends FwItem {
    constructor(ref: IFwFile) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.VirtualFolder;
        this.control = FwControl.Active;
    }


}

export class FwEmptyVirtualFolder extends FwItem {
    constructor(ref: IFwFile) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.EmptyVirtualFolder;
        this.control = FwControl.Active;
    }

    public static create(parent: FwItem | undefined, order: number): FwEmptyVirtualFolder {
        const orders = [...(parent?.ref.order ?? []), order];
        const orderPart = `${orders.join('.')}`;
        const name = "Scene";
        const orderedName = `${orderPart} ${name}`;
        const projectTag = 'fw';
        const fsExt = '.md';
        const ext = `.${projectTag}${fsExt}`;
        const fsName = `${orderedName}${ext}`;
        const fsPath = path.posix.join(parent?.ref.fsPath ?? '', fsName);

        const file: IFwFile = {
            data: [],
            ext,
            fsDir: parent?.ref.fsDir ??'',
            fsExt,
            fsName,
            fsPath,
            name,
            orderedName,
            orderString: `${orderPart}`,
            projectTag,
            order: orders,
            fsExists: false
        };
        const result = new FwEmptyVirtualFolder(file);

        result.order = order;
        result.parentOrder = parent?.parentOrder ?? [];
        result.orderBy = `${orderPart}`;

        return result;
    }
}

export class FwEmpty extends FwItem {
    constructor() {
        super({
            data: [], ext: '', fsDir: '', fsExt: '', fsName: '', fsPath: '', name: '',
            orderedName: '', orderString: '', projectTag: '', fsExists: false
        });
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwFolderItem extends FwItem {
    constructor(ref: IFwFile) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwWorkspaceFolderItem extends FwItem {
    constructor(ref: IFwFile) {
        super(ref);
        this.type = FwType.Folder;
        this.subType = FwSubType.WorkspaceFolder;
        this.control = FwControl.Never;
    }
}

export class FwProjectFileItem extends FwItem {
    constructor(ref: IFwFile) {
        super(ref);
        this.type = FwType.File;
        this.subType = FwSubType.ProjectFile;
        this.control = FwControl.Active;
    }
}

export class FwTextFileItem extends FwItem {
    constructor(ref: IFwFile) {
        super(ref);
        this.type = FwType.File;
        this.subType = FwSubType.TextFile;
        this.control = FwControl.Possible;
    }
}

export class FwOtherFileItem extends FwItem {
    constructor(ref: IFwFile) {
        super(ref);
        this.type = FwType.File;
        this.subType = FwSubType.OtherFile;
        this.control = FwControl.Never;
    }
}

