import {Node} from './node';
import {NodeType} from '../../modules/projectExplorer/nodeType';
import {FwFile} from '../index';
import {RootNode} from '../../modules/projectExplorer/projectNodes';
import {NodePermission} from './nodePermission';

export class NodeTree<T extends Node<any>>{
    public root: T;

    constructor(root:T) {
        this.root = root;
    }

    public getSiblings(node: T): T[] {
        if (!node) {
            return [];
        }
        if (!node.parent) {
            return [this.root];
        }
        return [...node.parent.children?.values() as IterableIterator<T> ?? []];
    }

    public getMatchingSiblings(node: T): T[] {
        return this.getSiblings(node).filter(s => s.type === s.type);
    }

    public getChildren(key: string | undefined): T[] {
        let result: T[] = [];
        if (!key) {
            result = [...this.root.children?.values() as IterableIterator<T> ?? []];
        } else {
            const node = this.getNode(key);
            if (node && node.children) {
                result = [...node.children.values() as IterableIterator<T>];
            }
        }
        // result.sort((a: T, b: T) => a.order - b.order);
        return [...result];
    }

    public getNode(element: string | undefined, tree?: Map<string, T>): T | undefined {
        if (!element) {
            return undefined;
        }

        const currentNode = tree ??
            new Map<string, T>([[this.root.id, this.root]]);

        // Check if the current node has the element
        const node = currentNode.get(element);
        if (node) {
            return node;
        }

        // If not found, recursively search in the children of the current node
        for (const childNode of currentNode.values()) {
            if (childNode.children && childNode.children.size > 0) {
                const found = this.getNode(element, childNode.children as Map<string, T>);
                if (found) {
                    return found;
                }
            }
        }

        // If the node is not found in any children, return undefined
        return undefined;
    }

    public addChild(parent: T, newNode: T): T | undefined {
        if (!parent.acceptsChildren || !parent.acceptsChild(newNode))
            return undefined;

        if (!parent.children) {
            parent.children = new Map<string, T>();
        }
        parent.children.set(newNode.id, newNode);
        newNode.parent = parent;
        return newNode;
    }

   public addSibling(node: T, newNode: T): T | undefined{
        if (!node.parent) {
            return this.addChild(this.root, newNode);
        }
        return this.addChild(node.parent as T, newNode);
   }

   public removeNode(node: T): void {
        if (!node) return;

        if (!node.parent) {
            return;
        }
        node.parent.children?.delete(node.id);
        node.parent = undefined;
   }


    // public sortChildren(root?: T) {
    //     if (!root?.children) {
    //         return;
    //     }
    //     const all = [...root.children.values()]
    //         .sort((a, b) => a.order - b.order);
    //     let counter = 0;
    //
    //     all.forEach((c, order) => {
    //         counter += FwFile.fixedGap;
    //         if (c.order !== 0) counter = Math.max(c.order, counter);
    //         c.order = counter;
    //         this.sortChildren(c);
    //     });
    // }

    public toList(): T[] {
       return this.root.toFlatList() as T[];
    }

    public clear(): NodeTree<T> {
        this.root?.children?.clear();
        return this;
    }
}