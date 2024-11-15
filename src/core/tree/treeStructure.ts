import {TreeNode} from './treeNode';
import {FwEmpty, FwRef, FwRootItem} from '../fwFiles';
import path from 'path';

export class TreeStructure<T> {
    public root: TreeNode<T>;
    private _nodes: Map<string, TreeNode<T>> = new Map<string, TreeNode<T>>();

        constructor(root: TreeNode<T>) {
        this.root = root;
        this._nodes.set(root.id, root);
    }

    public getRoot(): TreeNode<T> {
        return this.root;
    }

    public getNode(id: string): TreeNode<T> | undefined {
        return this._nodes.get(id);
    }

    public isRoot(node: TreeNode<T>): boolean {
        return node === this.root;
    }

    public detach(child: TreeNode<T>): void {
        if (child === this.root) return;
        if (child.parent === undefined) return;
        const index = child.parent.children.indexOf(child);
        if (index > -1) {
            child.parent.children.splice(index, 1);
        }
        child.parent = undefined;
        this._nodes.delete(child.id);
    }

    public insertFirst(child: TreeNode<T>, parent?: TreeNode<T>): void {
        if (!parent) parent = this.getRoot();

        parent.children.unshift(child);
        child.parent = parent;
        this._nodes.set(child.id, child);
    }

    public insertLast(child: TreeNode<T>, parent?: TreeNode<T>): void {
        if (!parent) parent = this.getRoot();

        parent.children.push(child);
        child.parent = parent;
        this._nodes.set(child.id, child);
    }

    public insertBefore(child: TreeNode<T>, target: TreeNode<T>): void {
        if (target.parent === undefined) return;

        const index = target.parent.children.indexOf(target);
        target.parent.children.splice(index, 0, child);
        child.parent = target.parent;
        this._nodes.set(child.id, child);
    }

    public insertAfter(child: TreeNode<T>, target: TreeNode<T>): void {
        if (target.parent === undefined) return;

        const index = target.parent.children.indexOf(target);
        target.parent.children.splice(index + 1, 0, child);
        child.parent = target.parent;
        this._nodes.set(child.id, child);
    }

    public addChild(child: TreeNode<T>, target: TreeNode<T>): void {
        if (target === undefined) return;

        child.parent = target;
        target.children.push(child);
        this._nodes.set(child.id, child);
    }

    public toList(): TreeNode<T>[] {
        return [...this._nodes.values()];
    }

    public dfsList(node: TreeNode<T> | undefined, sort:(a:TreeNode<T>, b: TreeNode<T>)=>number): TreeNode<T>[] {
        const result: TreeNode<T>[] = [];
        if (!node) return result;

        result.push(node);

        const children = [...node.children.sort(sort)];
        for (const child of children) {
            result.push(...this.dfsList(child, sort));
        }

        return result;
    }

    public clear() {
        this._nodes.clear();
        this.root.children = [];
        this._nodes.set(this.root.id, this.root);
    }
    public isAncestor(node: TreeNode<T> | undefined, possibleRelative: TreeNode<T>): boolean {
        if (!node) return false;
        if (node === possibleRelative) return true;
        if (node.parent === undefined) return false;

        return this.isAncestor(node.parent, possibleRelative);
    }
    public getAncestor(node: TreeNode<T> | undefined, condition:(node:TreeNode<T>)=>boolean): TreeNode<T> | undefined {
        if (!node) return undefined;
        if (condition(node)) return node;

        return this.getAncestor(node.parent, condition);
    }

    public toggleParent(node: TreeNode<T>, visible:boolean) {
        if (node === undefined) return;
        node.visible = true;

        if (node.parent) {
            this.toggleParent(node.parent, visible);
        }
    }

    public toggleChildren(node: TreeNode<T>, visible: boolean) {
        if (node === undefined) return;
        node.visible = visible;
        for(const child of node.children) {
            this.toggleChildren(child, visible);
        }
    }

    public selectChildren(node: TreeNode<T>, checked: boolean) {
        if (node === undefined) return;
        if (node.checked !== undefined) node.checked = checked;
        for(const child of node.children) {
            this.selectChildren(child, checked);
        }
    }
}
