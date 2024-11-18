import {IDefaultOrderInput, IOrderParser, IOrderProcessor} from './IOrderParser';
import {IFwOrderedName} from '../../IFwOrderedName';

export class SimpleSuffixOrderParser implements IOrderProcessor {
    orderRegex = /(?<name>.*?)(?<number>[0-9]+)$/;

    parse(name: string): IFwOrderedName {
        const matches = name.match(this.orderRegex);
        if (matches?.groups) {
            return {
                namePart: matches.groups.name,
                orderPart: matches.groups.order,
                mainOrder: parseInt(matches.groups.number),
                otherOrders: undefined,
                full: name
            };
        } else {
            return {
                namePart: name,
                orderPart: undefined,
                mainOrder: undefined,
                otherOrders: undefined,
                full: name
            };
        }
    }

    build(input: IDefaultOrderInput): IFwOrderedName {
        return {
            namePart: input.name ?? '',
            orderPart: input.order?.toString(),
            mainOrder: input.order,
            otherOrders: undefined,
            full: `${input.name}${input.order ?? ''}`
        };
    }

    serialize(input: IFwOrderedName): string {
        return `${input.full}`;
    }
}