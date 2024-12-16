import {EmptyFwOrder, IFwOrder} from '../../IFwOrder';
import {IOrderOptions} from './IOrderOptions';
import {OrderParser} from './OrderParser';
import {IParserOptions} from '../../../lib';
import {ITokens} from './IOrderParser';

export class SuffixOrderParser extends OrderParser {
    constructor(options: Partial<IOrderOptions> = {}) {
        super(
            /(?<name>.*?)(?<glue>[ \-_]?)(?<!^)(?<order>(\d+\.)*(\d+))$/,
            options);
    }

    serialize(input: ITokens<IFwOrder>, opt?: IParserOptions<string, ITokens<IFwOrder>> & {
        excludeUnparsed?: boolean
    }): string {
        let unparsed = input.unparsed ??= '';
        input.parsed ??= new EmptyFwOrder();
        const order = input.parsed.order.map((o, idx) => {
            let token = o.toString();
            if (input.parsed.padding.length >= idx) {
                token = token.padStart(input.parsed.padding[idx], '0');
            }
            return token;
        });

        if (opt?.excludeUnparsed === true) {
            unparsed = '';
        }

        return `${unparsed}${input.parsed.glue}${order.join(input?.parsed?.sep ?? '')}`;
    }
}