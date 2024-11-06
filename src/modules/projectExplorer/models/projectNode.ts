import {FwControl, FwPermission, FwType, Permissions, TreeNode} from '../../../core';
import {IFileState} from '../../../core/state';
import {IList} from '../../../core/lib/IList';
import {IProjectNodeContext} from './IProjectNodeContext';

export class ProjectNodeList implements IList<ProjectNode> {
    public items: ProjectNode[] = [];

    constructor(items: ProjectNode[]) {
        this.items = items;
    }

    sort(): IList<ProjectNode> {

        this.items.sort((a, b) => (a.data.fwItem?.orderBy ?? '') > (b.data.fwItem?.orderBy ?? '') ? 1 : -1);

        return this;
    }

    filter(): IList<ProjectNode> {
        this.items = this.items.filter(e => e.visible);

        return this;
    }
}

export class ProjectNode extends TreeNode<IFileState> {

    override acceptsChild(child: ProjectNode): boolean {
        if (child === this) return false;
        if (child.parent === this) return false;
        if (!this.acceptsChildren) return false;
        if (!Permissions.check(child.data.fwItem, FwPermission.Move)) return false;
        if (this.id.startsWith(child.id)) return false;

        return true;
    }

    override get acceptsChildren(): boolean {
        return this.data.fwItem?.type === FwType.Folder;
    }

    override get canMove(): boolean {
        return Permissions.check(this.data.fwItem, FwPermission.Move);
    }

    override get canEdit(): boolean {
        return Permissions.check(this.data.fwItem, FwPermission.Rename);
    }

    override get canDelete(): boolean {
        return Permissions.check(this.data.fwItem, FwPermission.Delete);
    }
}