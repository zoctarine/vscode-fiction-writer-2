import {IOrderOptions} from './IOrderOptions';
import {IFwOrder} from '../../IFwOrder';
import {IParser} from '../../../lib';


export interface IOrderParser extends IParser<string, IOrderOptions, IFwOrder> {
}