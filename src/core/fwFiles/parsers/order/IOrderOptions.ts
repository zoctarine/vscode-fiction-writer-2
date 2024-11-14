export interface IOrderOptions {
    radix: number;
    pad: number;
    separator: string;
}

export const defaultOrderOptions: IOrderOptions = {
    radix: 10,
    pad: 5,
    separator: '.'
};
