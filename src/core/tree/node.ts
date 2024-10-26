import {NodeType} from '../../modules/projectExplorer/nodeType';
import {NodePermission} from './nodePermission';

export class Node<T> {
    id: string;
    item: T;
    parent?: Node<T> = undefined;
    type: NodeType = NodeType.Root;
    permissions: NodePermission = NodePermission.None;
    children?: Map<string, Node<T>> = new Map<string, Node<T>>();
    canHaveChildren: boolean = true;

    constructor(id: string, value: T) {
        this.id = id;
        this.item = value;
    }

    acceptsChild(child: Node<T>): boolean {return true;}

    get acceptsChildren(): boolean {return true;}

    get isDraggable(): boolean {return true;}

    get hasTextContent(): boolean {return this.type === NodeType.File || this.type === NodeType.VirtualFolder;}

    public can(permission:NodePermission): boolean {
        return (this.permissions & permission) === permission;
    }

    public getClosestParent(type: NodeType): Node<T> | undefined {
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

    // /**
    //  * Temporary convert solution, until we have a better way to handle this
    //  * @param newTypek
    //  */
    // public convertTo<T1 extends T>(newType:T1): void {
    //     const newObj = new newType(this.id);
    //     Object.setPrototypeOf(this, newObj);
    //     this.type = newObj.type;
    //     this.permissions = newObj.permissions;
    // }
}


