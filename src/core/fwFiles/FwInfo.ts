import {FwSubType} from './FwSubType';
import {FwType} from './FwType';
import {FwControl} from './FwControl';
import {IFwOrder, IFwOrderedName} from './IFwOrderedName';
import {PrefixOrderParser} from './parsers';
import {FwPermission, Permissions} from './FwPermission';

/**
 * A full name could look like:
 * {@link order} {@link name}.{@link projectTag}.{@link data}.{@link ext}
 */
export interface IFwInfo {
    type: FwType;
    subType: FwSubType;
    control: FwControl;

    name: string;
    mainOrder: IFwOrder;
    subOrder: IFwOrder;
    /**
     * If the filename contains the projectTag, then it is returned here.
     * If it is missing, the file does not belong to the project
     */
    projectTag: string;
    /**
     * Optional data, extracted from filename
     */
    data: string[];

    orderBy: string;
}

/**
 * The FwItem class represents a disk resource handled by FictionWriter
 */
export class FwInfo implements IFwInfo {
    type: FwType = FwType.Unknown;
    subType: FwSubType = FwSubType.Unknown;
    control: FwControl = FwControl.Unknown;

    name: string = '';
    mainOrder: IFwOrder = {
        glue: '',
        sep: '',
        order: []
    };
    subOrder: IFwOrder = {
        glue: '',
        sep: '',
        order: []
    };
    projectTag: string = '';
    data: string[] = [];

    displayName:string='';
    displayExt:string='';
    orderBy: string = '';

    modified: string = '';

    constructor() {
    }

    public static morph(sub: IFwInfo, ctor: { new(): IFwInfo }) {
        if (!Permissions.check(sub, FwPermission.Morph)) return;

        const instance = new ctor();
        sub.type = instance.type;
        sub.control = instance.control;
        sub.subType = instance.subType;
        sub.projectTag = instance.projectTag;

        Object.setPrototypeOf(sub, Object.getPrototypeOf(instance));
    }
}

export class FwRootItem extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.Root;
        this.control = FwControl.Never;
        this.name = 'root';
    }
}

export class FwVirtualFolderItem extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.VirtualFolder;
        this.control = FwControl.Active;
        this.projectTag = 'fw';
    }
}

export class FwEmpty extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwFolderItem extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwWorkspaceFolderItem extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.WorkspaceFolder;
        this.control = FwControl.Never;
    }
}

export class FwProjectFileItem extends FwInfo {
    constructor() {
        super();
        this.type = FwType.File;
        this.subType = FwSubType.ProjectFile;
        this.control = FwControl.Active;
        this.projectTag = 'fw';
    }
}

export class FwTextFileItem extends FwInfo {
    constructor() {
        super();
        this.type = FwType.File;
        this.subType = FwSubType.TextFile;
        this.control = FwControl.Possible;
    }
}

export class FwOtherFileItem extends FwInfo {
    constructor() {
        super();
        this.type = FwType.File;
        this.subType = FwSubType.OtherFile;
        this.control = FwControl.Never;
    }
}

