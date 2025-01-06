
export interface IFwOrder {
    order: number[];
    padding: number[];
    glue: string;
    sep: string;
}

export class EmptyFwOrder implements IFwOrder{
    order: number[] = [];
    padding: number[] = [];
    glue: string = ' ';
    sep: string = '.';
}