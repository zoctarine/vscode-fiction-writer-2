export interface IFwOrderedName {
    name: string;
    order: number[];
}

export class EmptyFwOrderedName implements IFwOrderedName {
    name: string = '';
    order: number[] = [];
};