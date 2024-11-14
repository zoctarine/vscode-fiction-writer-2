export interface IParser<T, TOpt, TOut> {
    parse(unparsed: T, opt?: Partial<TOpt>): TOut,
    compile(parsed: TOut, opt?: TOpt): T
}

export interface IAsyncParser<T, TOpt, TOut> {
    parse(unparsed: T, opt?: Partial<TOpt>): Promise<TOut>,
    compile(parsed: TOut, opt?: TOpt): Promise<T>
}