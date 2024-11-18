export interface IFwOrderedName {
    namePart: string;
    orderPart: string | undefined;
    mainOrder: number | undefined;
    otherOrders: number[] | undefined;
    full: string;
}

export const EmptyFwOrderedName : IFwOrderedName = {
    namePart: '',
    orderPart: undefined,
    mainOrder: undefined,
    otherOrders: undefined,
    full: '',
};