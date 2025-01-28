export interface IProcessor<TIn, TOut, TOptions> {
	run(data?: TIn, options?:Partial<TOptions>): TOut
}

export interface IStateProcessor<TState> extends IProcessor<TState, Promise<void>, any> {

}

