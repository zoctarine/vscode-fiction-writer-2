import {IFwOrderedName} from '../../IFwOrderedName';
import {IOrderOptions} from './IOrderOptions';
import {OrderParser} from './OrderParser';

export class SuffixOrderParser extends OrderParser {
    constructor(options: Partial<IOrderOptions> = {}) {
        super(
            /(?<name>.*?)(?<glue>[ \-_]?)(?<order>(\d+\.)*(\d+))$/,
            options);
    }

    serialize(parsed: IFwOrderedName, options: Partial<IOrderOptions> = {}): string {
        const opt = {...this.options, ...options};
        const order = [...parsed.order ?? []];

        return `${parsed.name ?? ''}${parsed.glue}${order.join(parsed.sep)}`;
    }
}