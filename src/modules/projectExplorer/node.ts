import {NodeType} from './nodeType';
import {FwFile} from '../../core';
import path from 'path';

export class Node {
    id: string;
    name: string;
    ext: string = "";
    parent?: Node = undefined;
    description?: string;
    order: number = 0;
    type: NodeType = NodeType.Root;
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

    public buildFsName(): string {
        return `[${this.order.toString(FwFile.radix).padStart(FwFile.pad, '0')}] ${this.name}${this.ext}`;
    }

    public buildFsPath(): string {
        const segments = [this.buildFsName()];
        let cursor = this?.parent;
        while (cursor && cursor?.type !== NodeType.WorkspaceFolder) {
            if (cursor.type === NodeType.VirtualFolder) {
                const prev=segments[segments.length - 1];
                segments[segments.length - 1] = `[${cursor.order.toString(FwFile.radix).padStart(FwFile.pad, '0')}]`+prev;
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
}