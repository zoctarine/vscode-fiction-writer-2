import {IFwOrder} from '../../IFwOrder';
import {IStringParser} from '../../../lib';

export interface IOrderParser extends IStringParser<ITokens<IFwOrder>> {
    computeNextOrderFor(orderedNames: string[], baseOrder: number[]): number;
}

export interface ITokens<TOut> {
    unparsed: string;
    parsed: TOut;
}