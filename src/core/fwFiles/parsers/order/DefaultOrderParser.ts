import {IOrderParser} from './IOrderParser';
import {defaultOrderOptions, IOrderOptions} from './IOrderOptions';
import {IFwOrderedName} from '../../IFwOrderedName';

export class DefaultOrderParser implements IOrderParser {
    orderRegex = /^(\d+\.)*(\d+)(?: )/i;

    parse(orderedName: string, options: Partial<IOrderOptions> = {}): IFwOrderedName {
        const opt = {...defaultOrderOptions, ...options};
        let namePart = orderedName;
        let orderPart = '';
        let orderList: number[] = [];
        const matches = orderedName.match(this.orderRegex);
        if (matches) {
            orderPart = matches[0];
            orderList = orderPart.split(opt.separator).map(o => {
                const order = parseInt(o, 10);
                return Number.isNaN(order) ? 0 : order;
            });
            namePart = orderedName.substring(orderPart.length);
        }

        return {
            name: namePart,
            order: orderList
        };
    }

    serialize(parsed: IFwOrderedName, options?: IOrderOptions): string {
        const order = [...parsed.order ?? []];

        return `${order.join('.')} ${parsed.name ?? ''}`;
    }

    computeNextOrderFor(orderedNames: string[], parentOrder: number[]): number {
        parentOrder ??= [];

        const maxOrder = orderedNames
            .filter(n => n !== undefined)
            .map(n => this.parse(n)?.order)
            .filter(o => o?.join('.').startsWith(parentOrder.join('.'))) // only orders that are in same level
            .map(o => o?.slice(parentOrder.length))// remove the array
            .filter(o => o?.length > 0)
            .reduce((max, crt) => Math.max(max, crt[0]), 0);

        return maxOrder + 1;
    }
}