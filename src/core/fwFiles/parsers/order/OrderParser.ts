import {IOrderParser, ITokens,} from './IOrderParser';
import {IFwOrder} from '../../IFwOrder';
import {defaultOrderOptions, IOrderOptions} from './IOrderOptions';
import {IParserOptions} from '../../../lib';

export abstract class OrderParser implements IOrderParser {
    protected options: IOrderOptions;

    protected constructor(protected orderRegex: RegExp, options: Partial<IOrderOptions> = {}) {
        this.options = {...defaultOrderOptions, ...options};
    }

    parse(orderedName: string, opt?: IParserOptions<string, ITokens<IFwOrder>>): ITokens<IFwOrder> {
        opt = {...this.options, ...opt};
        let namePart = orderedName;
        let orderPart = '';
        let gluePart = '';
        let orderList: number[] = [];
        let orderPadding: number[] = [];
        const matches = orderedName.match(this.orderRegex);
        if (matches?.groups) {
            const {order, name, glue} = matches.groups;
            gluePart = glue ?? '';
            orderPart = order ?? '';
            orderList = orderPart?.split(opt.separator).map((o, idx) => {
                const order = parseInt(o, 10);
                orderPadding.splice(idx, 0, o.length);
                return Number.isNaN(order) ? 0 : order;
            }) ?? [];
            namePart = name ?? '';
        }

        const result = {
            unparsed: namePart,
            parsed: {
                order: orderList,
                padding: orderPadding,
                glue: gluePart,
                sep: opt.separator
            }
        };

        if (opt?.onParse) {
            opt.onParse(result);
        }

        return result;
    }

    abstract serialize(parsed: ITokens<IFwOrder>, opt?: IParserOptions<string, ITokens<IFwOrder>>): string;

    computeNextOrderFor(orderedNames: string[], parentOrder: number[]): number {
        parentOrder ??= [];

        const maxOrder = orderedNames
            .filter(n => n !== undefined)
            .map(n => this.parse(n)?.parsed?.order ?? [])
            .filter(o => o?.join('.').startsWith(parentOrder.join('.'))) // only orders that are in same level
            .map(o => o?.slice(parentOrder.length))// remove the array
            .filter(o => o?.length > 0)
            .reduce((max, crt) => Math.max(max, crt[0]), 0);

        return maxOrder + 1;
    }
}