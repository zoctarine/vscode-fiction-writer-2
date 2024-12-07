import {IStateProcessor} from '../processors';
import {IFwOrderedName, IOrderOptions} from '../fwFiles';

export interface IParser<T, TOpt, TOut> {
    parse(unparsed: T, opt?: Partial<TOpt>): TOut,

    serialize(parsed: TOut, opt?: TOpt): T
}

export interface IAsyncParser<T, TOpt, TOut> {
    parseAsync(unparsed: T, opt?: Partial<TOpt>): Promise<TOut>,

    serializeAsync(parsed: TOut, opt?: TOpt): Promise<T>
}

export interface ParseResult<TIn, TOut> {
    unparsed: TIn;
    parsed: TOut | undefined;
}


export class FwFilenameProcessor {
    private _parsers: {
        parser: IParser<any, any, any>,
        next: (value: any, ctx: any) => any,
        prev: (value: any, ctx: any) => any
    }[] = [];

    constructor() {
    }

    add<T, TOut>(parser: IParser<T, any, TOut>,
                 next: (value: TOut, ctx: any) => T,
                 prev: (value: T, ctx: any) => TOut,
    ): FwFilenameProcessor {
        this._parsers.push({
            parser, next, prev
        });

        return this;
    }

    parse(unparsed: any, ctx: any): string {
        let current = unparsed;
        for (const {parser, next} of this._parsers) {
            const parsed = parser.parse(current);
            current = next(parsed, ctx);
        }
        return current;
    }

    serialize(parsed: any, ctx:any): any {
        let current = parsed;
        let parsers = [...this._parsers].reverse();
        let result = '';
        for (const {parser, prev} of parsers) {
            result = prev(current, ctx);
            current = parser.serialize(result);
        }
        return current;
    }
}
