import {IOrderParser,} from './IOrderParser';
import {IFwOrderedName} from '../../IFwOrderedName';

export class SimpleSuffixOrderParser implements IOrderParser {
    orderRegex = /(?<name>.*?)(?<number>[0-9]+)$/;

    parse(name: string): IFwOrderedName {
        const matches = name.match(this.orderRegex);
        if (matches?.groups) {
            return {
                name: matches.groups.name,
                order: [parseInt(matches.groups.number)],
            };
        } else {
            return {
                name: name,
                order: [],
            };
        }
    }

    serialize(input: IFwOrderedName): string {
        return `${input.name ?? ''}${input.order ?? ''}`;
    }
}