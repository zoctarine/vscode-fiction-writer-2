import {FwControl, FwPermission, FwType, Permissions, TreeNode} from '../../../core';
import {IFileState} from '../../../core/state';
import {Collections} from '../../../core/lib/collections';
import {IProjectNodeContext} from './IProjectNodeContext';

export class ProjectNodeList implements Collections<ProjectNode> {
    public items: ProjectNode[] = [];

    constructor(items: ProjectNode[]) {
        this.items = items;
    }

    sort(): Collections<ProjectNode> {

        this.items.sort((a, b) => (a.data.fwItem?.ref?.orderBy ?? '') > (b.data.fwItem?.ref?.orderBy ?? '') ? 1 : -1);

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
        if (!Permissions.check(child.data.fwItem?.ref, FwPermission.Move)) return false;
        if (this.id.startsWith(child.id)) return false;

        return true;
    }

    override get acceptsChildren(): boolean {
        return Permissions.check(this.data.fwItem?.ref, FwPermission.AddChildren);
    }

    override get canMove(): boolean {
        return Permissions.check(this.data.fwItem?.ref, FwPermission.Move);
    }

    override get canEdit(): boolean {
        return Permissions.check(this.data.fwItem?.ref, FwPermission.Rename);
    }

    override get canDelete(): boolean {
        return Permissions.check(this.data.fwItem?.ref, FwPermission.Delete);
    }
}