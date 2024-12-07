
export interface IFwOrder {
    order: number[];
    glue: string;
    sep: string;
}

export interface IFwOrderedName extends IFwOrder {
    name: string;
    order: number[];
    glue: string;
    sep: string;
}

export class EmptyFwOrderedName implements IFwOrderedName {
    name: string = '';
    order: number[] = [];
    glue: string = ' ';
    sep: string = '.';
}