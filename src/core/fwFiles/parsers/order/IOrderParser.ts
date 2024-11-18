import {IOrderOptions} from './IOrderOptions';
import {IFwOrderedName} from '../../IFwOrderedName';
import {IBuilder, IParser} from '../../../lib';


export interface IOrderParser extends IParser<string, IOrderOptions, IFwOrderedName> {
}

export interface IOrderBuilder extends IBuilder<IDefaultOrderInput, IFwOrderedName> {}

export interface IDefaultOrderInput {
    order?: number,
    otherOrders?: number[],
    name?: string;
}

export interface IOrderProcessor extends IOrderParser, IOrderBuilder {

}