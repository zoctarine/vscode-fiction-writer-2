import {IOrderOptions} from './IOrderOptions';
import {IFwOrderedName} from '../../IFwOrderedName';
import {IParser} from '../../../lib';


export interface IOrderParser extends IParser<string, IOrderOptions, IFwOrderedName> {
    computeNextOrderFor(orderedNames: string[], baseOrder: number[]): number;
}
