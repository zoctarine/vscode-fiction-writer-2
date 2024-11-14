import {IOrderParser} from './IOrderParser';
import {IFwOrder} from '../../IFwOrder';

export class SimpleSuffixOrderParser implements IOrderParser {
    orderRegex = /(?<name>.*?)(?<number>[0-9]+)$/;

    parse(name: string): IFwOrder {
        const matches = name.match(this.orderRegex);
        if (matches?.groups) {
            return {
                namePart: matches.groups.name,
                orderPart: matches.groups.order,
                mainOrder: parseInt(matches.groups.number),
                otherOrders: undefined
            };
        } else {
            return {
                namePart: name,
                orderPart: undefined,
                mainOrder: undefined,
                otherOrders: undefined,
            };
        }
    }

    compile(input: IFwOrder): string {
        return `${input.namePart}${input.mainOrder ?? ''}`;
    }
}