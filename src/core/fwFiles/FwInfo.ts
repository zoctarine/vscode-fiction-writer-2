import {FwSubType} from './FwSubType';
import {FwType} from './FwType';
import {FwControl} from './FwControl';
import {IFwOrder} from './IFwOrder';
import {FwPermission, Permissions} from './FwPermission';

import {IFwExtension} from './IFwExtension';

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
    extension: IFwExtension;
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
        order: [],
        padding: []
    };
    subOrder: IFwOrder = {
        glue: '',
        sep: '',
        order: [],
        padding: []
    };
    extension: IFwExtension = {
        projectTag: '',
        data: [],
        glue: '',
    };

    constructor() {
    }

    public static morph(sub: IFwInfo, ctor: { new(): IFwInfo }) {
        if (!Permissions.check(sub, FwPermission.Morph)) return;

        const instance = new ctor();
        sub.type = instance.type;
        sub.control = instance.control;
        sub.subType = instance.subType;
        sub.extension.projectTag = instance.extension.projectTag;
        sub.extension.data = instance.extension.data;
        sub.extension.glue = instance.extension.glue;

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
        this.extension.projectTag = 'fw';
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
        this.extension.projectTag = 'fw';
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

