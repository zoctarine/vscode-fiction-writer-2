import {FwSubType} from '../fwFiles';

export class TreeNode<T> {
    public id: string;
    public data: T;
    public parent?: TreeNode<T> = undefined;
    public children: TreeNode<T>[] = [];
    public visible = true;
    public selected = false;
    public checked: boolean|undefined = undefined;
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

    public acceptsChild(child: TreeNode<T>): boolean{
        return true;
    }

    public get acceptsChildren(): boolean {
        return true;
    }

    public get canMove(): boolean {
        return true;
    }

    public get canEdit(): boolean {
        return true;
    }

    public get canDelete(): boolean {
        return true;
    }
}