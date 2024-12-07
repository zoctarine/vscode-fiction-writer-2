import {IOrderOptions} from './IOrderOptions';
import {IFwOrderedName} from '../../IFwOrderedName';
import {OrderParser} from './OrderParser';

export class PrefixOrderParser extends OrderParser {
    constructor(options: Partial<IOrderOptions> = {}) {
        super(
            /^(?<order>(\d+\.)*(\d+\.?))(?<glue>[ \-_]?)(?<name>.*?)$/i,
            options
        );
    }

    serialize(parsed: IFwOrderedName, options: Partial<IOrderOptions> = {}): string {
        const opt = {...this.options, ...options};
        const order = [...parsed.order ?? []];

        return `${order.join(parsed.sep)}${parsed.glue}${parsed.name ?? ''}`;
    }
}