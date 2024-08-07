import {NodeType, RootFolderType} from './nodeType';
import {FwFile} from '../../core';
import path from 'path';
import {NodePermission} from './nodePermission';


export class Node {
    id: string;
    name: string;
    ext: string = "";
    parent?: Node = undefined;
    description?: string;
    order: number = 0;
    type: NodeType = NodeType.Root;
    permissions: NodePermission = NodePermission.None;
    children?: Map<string, Node> = new Map<string, Node>();
    fsName: string = '';

    constructor(id: string, name?: string) {
        this.id = id;
        this.name = name ?? this.id;
    }

    acceptsChild(child: Node): boolean {
        if (!child.isDraggable) return false;
        if (child === this) return false;
        if (child.parent === this) return false;
        if (this.id.startsWith(child.id)) return false;
        if (this.type === NodeType.File) return false;
        if (this.type === NodeType.VirtualFolder && ![NodeType.VirtualFolder, NodeType.File].includes(child.type)) return false;
        if (this.type === NodeType.Folder && ![NodeType.Folder, NodeType.File, NodeType.VirtualFolder].includes(child.type)) return false;

        return true;
    }

    get acceptsChildren(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.VirtualFolder
            || this.type === NodeType.WorkspaceFolder;
    }

    get isDraggable(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.File
            || this.type === NodeType.VirtualFolder;
    }

    public can(permission:NodePermission): boolean {
        return (this.permissions & permission) === permission;
    }

    public getClosestParent(type: NodeType): Node | undefined {
        let cursor = this?.parent;
        while (cursor && cursor?.type !== type) {
            cursor = cursor?.parent;
        }

        return cursor;
    }

    public buildFsName(): string {
        return `${FwFile.toOrderString(this.order)} ${this.name}${this.ext}`;
    }

    public buildFsPath(): string {
        const segments = [this.buildFsName()];
        let cursor = this?.parent;
        while (cursor && cursor?.type !== NodeType.WorkspaceFolder) {
            if (cursor.type === NodeType.VirtualFolder) {
                const prev = segments[segments.length - 1];
                segments[segments.length - 1] = FwFile.toOrderString(cursor.order) + prev;
            } else {
                if (cursor) segments.push(cursor.buildFsName());
            }
            cursor = cursor.parent;
        }
        if (cursor) {
            segments.push(cursor.id ?? "");
        }
        return path.posix.join(...segments.reverse());
    }

    public toFlatList(): Node[] {
        const result: Node[] = [];

        const traverse = (node: Node) => {
            if (!node) return;
            result.push(node);
            if (node.children) {
                node.children.forEach(child => traverse(child));
            }
        };
        traverse(this);
        return result;
    }

    /**
     * Temporary convert solution, until we have a better way to handle this
     * @param newType
     */
    public convertTo<T extends Node>(newType: new (id: string) => T): void {
        const newObj = new newType(this.id);
        Object.setPrototypeOf(this, newObj);
        this.type = newObj.type;
        this.permissions = newObj.permissions;
    }
}


export class WorkspaceFolderNode extends Node {
    constructor(id: string) {
        super(id);
        this.type = NodeType.WorkspaceFolder;
        this.permissions = NodePermission.Read | NodePermission.Write;
    }
}

export class FolderNode extends Node {
    constructor(id: string) {
        super(id);
        this.type = NodeType.Folder;
        this.permissions = NodePermission.Read | NodePermission.Write | NodePermission.Delete | NodePermission.Rename | NodePermission.Move;
    }
}

export class FileNode extends Node {
    constructor(id: string) {
        super(id);
        this.type = NodeType.File;
        this.permissions = NodePermission.Read | NodePermission.Write | NodePermission.Delete | NodePermission.Rename | NodePermission.Move;
    }
}

export class VirtualFolderNode extends Node {
    constructor(id: string) {
        super(id);
        this.type = NodeType.VirtualFolder;
        this.permissions = NodePermission.Read | NodePermission.Write | NodePermission.Delete | NodePermission.Rename | NodePermission.Move;
    }
}

export class RootNode extends Node {
    constructor() {
        super('root');
        this.type = NodeType.Root;
        this.permissions = NodePermission.Read | NodePermission.Write;
    }
}

export class RootFolderNode extends Node {
    public rootFolderType: RootFolderType;

    constructor(id: string, rootFolderType: RootFolderType) {
        super(id);
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
