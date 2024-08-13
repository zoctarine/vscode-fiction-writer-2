import {NodeType, RootFolderType} from './nodeType';
import {FwFile} from '../../core/fwFile';
import path from 'path';
import {Node, NodePermission} from '../../core/tree';
import {ProjectItem} from './projectItem';

export class ProjectNode extends Node<ProjectItem> {
    constructor(id: string, item: ProjectItem) {
        super(id, item);
    }

    override acceptsChild(child: Node<ProjectItem>): boolean {
        if (!child.isDraggable) return false;
        if (child === this) return false;
        if (child.parent === this) return false;
        if (this.id.startsWith(child.id)) return false;
        if (this.type === NodeType.File) return false;
        if (this.type === NodeType.VirtualFolder && ![NodeType.VirtualFolder, NodeType.File].includes(child.type as NodeType)) return false;
        if (this.type === NodeType.Folder && ![NodeType.Folder, NodeType.File, NodeType.VirtualFolder].includes(child.type as NodeType)) return false;

        return true;
    }

    override get acceptsChildren(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.VirtualFolder
            || this.type === NodeType.WorkspaceFolder;
    }

    override get isDraggable(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.File
            || this.type === NodeType.VirtualFolder;
    }

    public buildFsPath(): string {
        const segments = [this.item.buildFsName()];
        let cursor = this?.parent;
        while (cursor && cursor?.type !== NodeType.WorkspaceFolder) {
            if (cursor.type === NodeType.VirtualFolder) {
                const prev = segments[segments.length - 1];
                segments[segments.length - 1] = FwFile.toOrderString(cursor.item.order) + prev;
            } else {
                if (cursor) segments.push(cursor.item.buildFsName());
            }
            cursor = cursor.parent;
        }
        if (cursor) {
            segments.push(cursor.id ?? "");
        }
        return path.posix.join(...segments.reverse());
    }

}

export class WorkspaceFolderNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.WorkspaceFolder;
        this.permissions = NodePermission.Read | NodePermission.Write;
    }
}

export class FolderNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.Folder;
        this.permissions = NodePermission.Read | NodePermission.Write | NodePermission.Delete | NodePermission.Rename | NodePermission.Move;
    }
}

export class FileNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.File;
        this.permissions = NodePermission.Read | NodePermission.Write | NodePermission.Delete | NodePermission.Rename | NodePermission.Move;
    }
}

export class VirtualFolderNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.VirtualFolder;
        this.permissions = NodePermission.Read | NodePermission.Write | NodePermission.Delete | NodePermission.Rename | NodePermission.Move;
    }
}

export class RootNode extends ProjectNode {
    constructor() {
        super('root', new ProjectItem());
        this.type = NodeType.Root;
        this.permissions = NodePermission.Read | NodePermission.Write;
    }
}

export class RootFolderNode extends ProjectNode {
    public rootFolderType: RootFolderType;

    constructor(id: string, rootFolderType: RootFolderType) {
        super(id, new ProjectItem());
        this.type = NodeType.RootFolder;
        this.rootFolderType = rootFolderType;
        this.permissions = NodePermission.Read | NodePermission.Write;
    }
}

export class TrashNode extends RootFolderNode {
    constructor() {
        super('trash', RootFolderType.Trash);
    }
}