import {IOrderParser} from './IOrderParser';
import {defaultOrderOptions, IOrderOptions} from './IOrderOptions';
import {IFwOrder} from '../../IFwOrder';

export class DefaultOrderParser implements IOrderParser {
    orderRegex = /^(\d+\.)*(\d*) /i;

    parse(source: string, options: Partial<IOrderOptions> = {}): IFwOrder {
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
            otherOrders: orderList
        };
    }

    compile(parsed: IFwOrder, options?: IOrderOptions): string {
        throw new Error('Method not implemented.');
    }
}