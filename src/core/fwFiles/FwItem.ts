import {IFwRef} from './IFwRef';
import {FwSubType} from './FwSubType';
import path from 'path';
import {FwType} from './FwType';
import {FwControl} from './FwControl';
import {FwFile} from './FwFile';

/**
 * The FwItem class represents a disk resource handled by FictionWriter
 */
export class FwItem extends FwFile {
    public type: FwType = FwType.Unknown;
    public subType: FwSubType = FwSubType.Unknown;
    public control: FwControl = FwControl.Unknown;

    public order: number = 0;
    public parentOrder: number[] = [];
    public orderBy: string = '';

    constructor(readonly fwFile: FwFile) {
        super(fwFile.ref, fwFile.meta);
    }
}

export class FwRootItem extends FwItem {
    constructor() {
        super({
            ref: {
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
                fsIsFile: false,
                fsIsFolder: true,
                fsExists: false
            }
        });
        this.type = FwType.Folder;
        this.subType = FwSubType.Root;
        this.control = FwControl.Never;
    }
}

export class FwVirtualFolderItem extends FwItem {
    constructor(fwFile: FwFile) {
        super(fwFile);
        this.type = FwType.Folder;
        this.subType = FwSubType.VirtualFolder;
        this.control = FwControl.Active;
    }
}

export class FwEmptyVirtualFolder extends FwItem {
    constructor(fwFile: FwFile) {
        super(fwFile);
        this.type = FwType.Folder;
        this.subType = FwSubType.EmptyVirtualFolder;
        this.control = FwControl.Active;
    }

    public static create(parent: FwItem | undefined, order: number): FwEmptyVirtualFolder {
        const orders = [...(parent?.ref.order ?? []), order];
        const orderPart = `${orders.join('.')}`;
        const name = "empty";
        const orderedName = `${orderPart} ${name}`;
        const projectTag = 'fw';
        const fsExt = '.md';
        const ext = `.${projectTag}${fsExt}`;
        const fsName = `${orderedName}${ext}`;
        const fsPath = path.posix.join(parent?.ref.fsPath ?? '', fsName);
        const ref: IFwRef = {
            data: [],
            ext,
            fsDir: parent?.ref.fsDir ?? '',
            fsExt,
            fsName,
            fsPath,
            name,
            orderedName,
            orderString: `${orderPart}`,
            projectTag,
            order: orders,
            fsIsFolder: false,
            fsIsFile: true,
            fsExists: false
        };
        const result = new FwEmptyVirtualFolder({ref});

        result.order = order;
        result.parentOrder = parent?.parentOrder ?? [];
        result.orderBy = `${orderPart}`;

        return result;
    }
}

export class FwEmpty extends FwItem {
    constructor() {
        super({
            ref: {
                data: [], ext: '', fsDir: '', fsExt: '', fsName: '', fsPath: '', name: '',
                orderedName: '', orderString: '', projectTag: '', fsExists: false,
                fsIsFolder: false, fsIsFile: true
            }
        });
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwFolderItem extends FwItem {
    constructor(fwFile: FwFile) {
        super(fwFile);
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwWorkspaceFolderItem extends FwItem {
    constructor(fwFile: FwFile) {
        super(fwFile);
        this.type = FwType.Folder;
        this.subType = FwSubType.WorkspaceFolder;
        this.control = FwControl.Never;
    }
}

export class FwProjectFileItem extends FwItem {
    constructor(fwFile: FwFile) {
        super(fwFile);
        this.type = FwType.File;
        this.subType = FwSubType.ProjectFile;
        this.control = FwControl.Active;
    }
}

export class FwTextFileItem extends FwItem {
    constructor(fwFile: FwFile) {
        super(fwFile);
        this.type = FwType.File;
        this.subType = FwSubType.TextFile;
        this.control = FwControl.Possible;
    }
}

export class FwOtherFileItem extends FwItem {
    constructor(fwFile: FwFile) {
        super(fwFile);
        this.type = FwType.File;
        this.subType = FwSubType.OtherFile;
        this.control = FwControl.Never;
    }
}

