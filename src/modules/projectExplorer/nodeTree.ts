import {Node} from './node';
import {NodeType} from './nodeType';
import {FwFile} from '../../core';

export class NodeTree {
    public root: Node;

    constructor() {
        this.root = new Node('root');
    }

    public getSiblings(node: Node): Node[] {
        if (!node) {
            return [];
        }
        if (!node.parent) {
            return [this.root];
        }
        return [...node.parent.children?.values() ?? []];
    }

    public getMatchingSiblings(node: Node): Node[] {
        return this.getSiblings(node).filter(s => s.type === s.type);
    }

    public getChildren(key: string | undefined): Node[] {
        let result: Node[] = [];
        if (!key) {
            result = [...this.root.children?.values() ?? []];
        } else {
            const node = this.getNode(key);
            if (node && node.children) {
                result = [...node.children.values()];
            }
        }

        result.sort((a: Node, b: Node) => a.order - b.order);

        return [...result];
            // : [
            //     ...result.filter((a: Node) => a.type === NodeType.WorkspaceFolder),
            //     ...result.filter((a: Node) => a.type === NodeType.Folder),
            //     ...result.filter((a: Node) => a.type === NodeType.File),
            // ];
    }

    public getNode(element: string | undefined, tree?: Map<string, Node>): Node | undefined {
        if (!element) {
            return undefined;
        }

        const currentNode = tree ??
            new Map<string, Node>([[this.root.id, this.root]]);

        // Check if the current node has the element
        const node = currentNode.get(element);
        if (node) {
            return node;
        }

        // If not found, recursively search in the children of the current node
        for (const childNode of currentNode.values()) {
            if (childNode.children && childNode.children.size > 0) {
                const found = this.getNode(element, childNode.children);
                if (found) {
                    return found;
                }
            }
        }

        // If the node is not found in any children, return undefined
        return undefined;
    }

    public sortChildren(root?: Node) {
        if (!root?.children) {
            return;
        }
        const all = [...root.children.values()]
            .sort((a, b) => a.order - b.order);
        let counter = 0;

        all.forEach((c, order) => {
            counter += FwFile.fixedGap;
            if (c.order !== 0) counter = Math.max(c.order, counter);
            c.order = counter;
            this.sortChildren(c);
        });
    }

    public toList(): Node[] {
       return this.root.toFlatList();
    }

    public clear(): NodeTree {
        this.root?.children?.clear();
        return this;
    }
}