import {FwSubType} from './FwSubType';
import {FwType} from './FwType';
import {FwControl} from './FwControl';
import {IFwOrder} from './IFwOrder';
import {FwPermission, Permissions} from './FwPermission';

import {IFwExtension} from './IFwExtension';

/**
 * A full name could look like:
 * {@link mainOrder}{@link name}.{@link subOrder}.{@link markers}.{@link ext}
 */
export interface IFwInfo {
    type: FwType;
    subType: FwSubType;
    control: FwControl;

    location: string;
    mainOrder: IFwOrder;
    name: string;
    subOrder: IFwOrder;
    markers: IFwExtension;
    ext: string;
}

/**
 * The FwItem class represents a disk resource handled by FictionWriter
 */
export class FwInfo implements IFwInfo {
    type: FwType = FwType.Unknown;
    subType: FwSubType = FwSubType.Unknown;
    control: FwControl = FwControl.Unknown;

    location: string = '';
    mainOrder: IFwOrder = {
        glue: '',
        sep: '',
        order: [],
        padding: []
    };
    name: string = '';
    subOrder: IFwOrder = {
        glue: '',
        sep: '',
        order: [],
        padding: []
    };
    markers: IFwExtension = {
        projectTag: '',
        data: [],
        glue: '',
    };
    ext: string = '';

    constructor() {
    }

    public static morph(sub: IFwInfo, ctor: { new(): IFwInfo }) {
        if (!Permissions.check(sub, FwPermission.Morph)) return;

        const instance = new ctor();
        sub.type = instance.type;
        sub.control = instance.control;
        sub.subType = instance.subType;
        sub.markers.projectTag = instance.markers.projectTag;
        sub.markers.data = instance.markers.data;
        sub.markers.glue = instance.markers.glue;

        Object.setPrototypeOf(sub, Object.getPrototypeOf(instance));
    }
}

export class FwRootInfo extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.Root;
        this.control = FwControl.Never;
        this.name = 'root';
    }
}

export class FwVirtualFolderInfo extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.VirtualFolder;
        this.control = FwControl.Active;
        this.markers.projectTag = 'fw';
        this.markers.glue = '.';
    }
}

export class FwEmptyInfo extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwFolderInfo extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.Folder;
        this.control = FwControl.Never;
    }
}

export class FwWorkspaceFolderInfo extends FwInfo {
    constructor() {
        super();
        this.type = FwType.Folder;
        this.subType = FwSubType.WorkspaceFolder;
        this.control = FwControl.Never;
    }
}

export class FwProjectFileInfo extends FwInfo {
    constructor() {
        super();
        this.type = FwType.File;
        this.subType = FwSubType.ProjectFile;
        this.control = FwControl.Active;
        this.markers.projectTag = 'fw';
    }
}

export class FwTextFileInfo extends FwInfo {
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

