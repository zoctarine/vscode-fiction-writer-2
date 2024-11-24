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
        const order = (input.order ?? []).pop();
        const name = input.name.length > 0 && !input.name.endsWith(' ')
            ? input.name + ' '
        : input.name;
        return `${name ?? ''}${order ?? ''}`;
    }

    computeNextOrderFor(orderedNames: string[], baseOrder: number[]): number {
        throw new Error('Method not implemented.');
    }
}