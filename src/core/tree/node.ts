import {FwSubType, FwPermission} from '../fwFiles';

/**
 * @deprecated TODO: to be moved
 */
export class Node<T> {
    id: string;
    item: T;
    parent?: Node<T> = undefined;
    type: FwSubType = FwSubType.Root;
    permissions: FwPermission = FwPermission.None;
    children?: Map<string, Node<T>> = new Map<string, Node<T>>();
    canHaveChildren: boolean = true;
    isVisible: boolean = true;
    sortBy: string = '';

    constructor(id: string, value: T) {
        this.id = id;
        this.item = value;
    }

    acceptsChild(child: Node<T>): boolean {return true;}

    get acceptsChildren(): boolean {return true;}

    get isDraggable(): boolean {return true;}

    get hasTextContent(): boolean {return this.type === FwSubType.ProjectFile || this.type === FwSubType.VirtualFolder;}

    public can(permission:FwPermission): boolean {
        return (this.permissions & permission) === permission;
    }

    public getClosestParent(type: FwSubType): Node<T> | undefined {
        let cursor = this?.parent;
        while (cursor && cursor?.type !== type) {
            cursor = cursor?.parent;
        }

        return cursor;
    }

    public toFlatList(): Node<T>[] {
        const result: Node<T>[] = [];

        const traverse = (node: Node<T>) => {
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


