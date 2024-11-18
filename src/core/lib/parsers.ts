export interface IParser<T, TOpt, TOut> {
    parse(unparsed: T, opt?: Partial<TOpt>): TOut,
    serialize(parsed: TOut, opt?: TOpt): T
}

export interface IAsyncParser<T, TOpt, TOut> {
    parse(unparsed: T, opt?: Partial<TOpt>): Promise<TOut>,
    serialize(parsed: TOut, opt?: TOpt): Promise<T>
}