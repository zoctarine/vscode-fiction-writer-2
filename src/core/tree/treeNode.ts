export class TreeNode<T> {
    public id: string;
    public data: T;
    public parent?: TreeNode<T> = undefined;
    public children: TreeNode<T>[] = [];
    public visible = true;
    public selected = false;
    public highlighted = false;

    constructor(id: string, data: T) {
        this.id = id;
        this.data = data;
    }

    public isLeaf(): boolean {
        return this.children.length === 0;
    }

    public isUnparented() {
        return this.parent === undefined;
    }
}