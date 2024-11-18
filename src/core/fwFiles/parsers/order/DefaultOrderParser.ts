import {IDefaultOrderInput, IOrderBuilder, IOrderParser, IOrderProcessor} from './IOrderParser';
import {defaultOrderOptions, IOrderOptions} from './IOrderOptions';
import {IFwOrderedName} from '../../IFwOrderedName';



export class DefaultOrderParser implements IOrderProcessor {
    orderRegex = /^(\d+\.)*(\d*) /i;

    parse(source: string, options: Partial<IOrderOptions> = {}): IFwOrderedName {
        const opt = {...defaultOrderOptions, ...options};
        let namePart = source;
        let orderPart = '';
        let orderList: number[] = [];
        let order: number | undefined;
        const matches = source.match(this.orderRegex);
        if (matches) {
            orderPart = matches[0];
            orderList = orderPart.trim().split(opt.separator).map(o => {
                const order = parseInt(o.trim(), 10);
                return Number.isNaN(order) ? 0 : order;
            });
            if (orderList.length > 0) {
                order = orderList.pop()!;
            }
            namePart = source.substring(orderPart.length - 1);
        }

        return {
            namePart,
            orderPart,
            mainOrder: order,
            otherOrders: orderList,
            full: source
        };
    }

    build(input: IDefaultOrderInput): IFwOrderedName {
        const orders = [];
        if (input.otherOrders && input.otherOrders.length > 0) {
            orders.push(...input.otherOrders);
        }
        if (input.order) {
            orders.push(input.order);
        }
        const orderPart = orders.join('.');

        return {
            orderPart: orderPart,
            namePart: input.name ?? '',
            mainOrder: input.order,
            otherOrders: input.otherOrders,
            full: `${orderPart ? orderPart + ' ' : ''}${input.name ?? ''}`
        };
    }

    serialize(parsed: IFwOrderedName, options?: IOrderOptions): string {
        return `${parsed.full}`;
    }
}