export interface IFwOrderedName {
    namePart: string | undefined;
    orderPart: string | undefined;
    mainOrder: number | undefined;
    otherOrders: number[] | undefined;
    full: string | undefined;
}

export const EmptyFwOrderedName : IFwOrderedName = {
    namePart: undefined,
    orderPart: undefined,
    mainOrder: undefined,
    otherOrders: undefined,
    full: undefined,
};