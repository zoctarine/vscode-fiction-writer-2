import {IOrderParser,} from './IOrderParser';
import {IFwOrderedName} from '../../IFwOrderedName';
import {defaultOrderOptions, IOrderOptions} from './IOrderOptions';

export abstract class OrderParser implements IOrderParser {
    protected options: IOrderOptions;

    protected constructor(protected orderRegex: RegExp, options: Partial<IOrderOptions> = {}) {
        this.options = {...defaultOrderOptions, ...options};
    }

    parse(orderedName: string, options: Partial<IOrderOptions> = {}): IFwOrderedName {
        const opt = {...this.options, ...options};
        let namePart = orderedName;
        let orderPart = '';
        let gluePart = '';
        let orderList: number[] = [];
        const matches = orderedName.match(this.orderRegex);
        if (matches?.groups) {
            const {order, name, glue} = matches.groups;
            gluePart = glue ?? '';
            orderPart = order ?? '';
            orderList = orderPart?.split(opt.separator).map(o => {
                const order = parseInt(o, 10);
                return Number.isNaN(order) ? 0 : order;
            }) ?? [];
            namePart = name ?? '';
        }

        return {
            name: namePart,
            order: orderList,
            glue: gluePart,
            sep: opt.separator
        };
    }

    abstract serialize(parsed: IFwOrderedName, options?: Partial<IOrderOptions>): string;

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