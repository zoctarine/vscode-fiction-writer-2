export interface IParserOptions<TIn, TOut> {
	onParse?: (parsed: TOut) => void;
	onSerialize?: (serialized: TIn) => void;

	[key: string]: any;
}

export interface IParser<T, TOut> {
	parse(unparsed: T, opt?: IParserOptions<T, TOut>): TOut,

	serialize(parsed: TOut, opt?: IParserOptions<T, TOut>): T
}

export interface IAsyncParser<T, TOut> {
	parseAsync(unparsed: T, opt?: Partial<IParserOptions<T, TOut>>): Promise<TOut>,

	serializeAsync(parsed: TOut, opt?: Partial<IParserOptions<T, TOut>>): Promise<T>
}

export interface IStringParser<TOut> extends IParser<string, TOut> {
}

export interface IAsyncStringParser<TOut> extends IAsyncParser<string, TOut> {
}