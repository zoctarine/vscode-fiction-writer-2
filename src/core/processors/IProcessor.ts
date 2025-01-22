export interface IProcessor<TIn, TOut> {
	run(data?: TIn): TOut
}

export interface IStateProcessor<TState> extends IProcessor<TState, Promise<void>> {

}

