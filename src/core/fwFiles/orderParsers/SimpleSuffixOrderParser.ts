import {IOrderParser} from './IOrderParser';
import {IFwOrder} from '../IFwOrder';
import {log} from '../../logging';

export class SimpleSuffixOrderParser implements IOrderParser {
    orderRegex = /(?<name>.*?)(?<number>[0-9]+)$/;

    parse(name: string): IFwOrder {
        const matches = name.match(this.orderRegex);
        log.tmp(matches);
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
        log.tmp(input);
        return `${input.namePart}${input.mainOrder ?? ''}`;
    }
}