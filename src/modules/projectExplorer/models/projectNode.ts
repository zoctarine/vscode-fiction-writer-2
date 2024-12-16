import {FwPermission, FwSubType, Permissions, TreeNode} from '../../../core';
import {IFileState} from '../../../core/state';
import {Collections} from '../../../core/lib/collections';

export class ProjectNodeList implements Collections<ProjectNode> {
    public items: ProjectNode[] = [];

    constructor(items: ProjectNode[]) {
        this.items = items;
    }

    sort(): Collections<ProjectNode> {

        this.items.sort((a, b) => (a.data.fwItem?.fsRef?.fsBaseName ?? '') > (b.data.fwItem?.fsRef?.fsBaseName ?? '') ? 1 : -1);

        return this;
    }

    filter(): Collections<ProjectNode> {
        this.items = this.items.filter(e => e.visible);

        return this;
    }
}

export class ProjectNode extends TreeNode<IFileState> {

    override acceptsChild(child: ProjectNode): boolean {
        if (child === this) return false;
        if (child.parent === this) return false;
        if (!this.acceptsChildren) return false;
        if (!Permissions.check(child.data.fwItem?.info, FwPermission.Move)) return false;
        if (this.id.startsWith(child.id)) return false;

        return true;
    }

    public acceptsType(childSubType: FwSubType): boolean {
        const info = this.data?.fwItem?.info;
        if (!info) return false;

        switch (childSubType) {
            case FwSubType.Unknown:
                return false;
            case FwSubType.Root:
                return false;
            case FwSubType.RootFolder:
                return false;
            case FwSubType.ProjectFile:
                return Permissions.check(info, FwPermission.AddChildFile) ||
                    Permissions.check(info, FwPermission.AddVirtualChild);
            case FwSubType.Folder:
                return Permissions.check(info, FwPermission.AddChildFolder) ||
                    Permissions.check(info, FwPermission.AddChildFile);
            case FwSubType.VirtualFolder:
                return Permissions.check(info, FwPermission.AddChildFile) ||
                    Permissions.check(info, FwPermission.AddVirtualChild | FwPermission.AddSiblings);
            case FwSubType.EmptyVirtualFolder:
                return Permissions.check(info, FwPermission.AddVirtualChild | FwPermission.AddSiblings);
            case FwSubType.WorkspaceFolder:
                return Permissions.check(info, FwPermission.AddChildFolder) ||
                    Permissions.check(info, FwPermission.AddChildFile);
            case FwSubType.Filter:
                return false;
            case FwSubType.FilterRoot:
                return false;
            case FwSubType.TextFile:
                return Permissions.check(info, FwPermission.AddChildFile);
            case FwSubType.OtherFile:
                return Permissions.check(info, FwPermission.AddChildFile);
        }

        return true;
    }

    override get acceptsChildren(): boolean {
        return Permissions.check(this.data.fwItem?.info, FwPermission.AddChildFolder) ||
            Permissions.check(this.data.fwItem?.info, FwPermission.AddChildFile);
    }

    override get acceptsVirtualChildren(): boolean {
        return Permissions.check(this.data.fwItem?.info, FwPermission.AddVirtualChild);
    }

    override get canMove(): boolean {
        return Permissions.check(this.data.fwItem?.info, FwPermission.Move);
    }

    override get canEdit(): boolean {
        return Permissions.check(this.data.fwItem?.info, FwPermission.Rename);
    }

    override get canDelete(): boolean {
        return Permissions.check(this.data.fwItem?.info, FwPermission.Delete);
    }
}


export class BackProjectNode extends ProjectNode{
    constructor() {
        super('back', {});
    }

    override acceptsChild(child: TreeNode<IFileState>): boolean { return false;}
    override get acceptsChildren(): boolean  { return false;}
    override get acceptsVirtualChildren(): boolean  { return false;}
    override get canMove(): boolean  { return false;}
    override get canEdit(): boolean  { return false;}
    override get canDelete(): boolean  { return false;}
}