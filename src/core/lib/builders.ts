export interface IBuilder<TIn, TOut> {
	build(input: TIn): TOut
}

export interface IAsyncBuilder<TIn, TOut> {
	buildAsync(input: TIn): Promise<TOut>
}



