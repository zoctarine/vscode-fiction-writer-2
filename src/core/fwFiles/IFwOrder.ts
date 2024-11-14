export interface IFwOrder {
    namePart: string | undefined;
    orderPart: string | undefined;
    mainOrder: number | undefined;
    otherOrders: number[] | undefined;
}