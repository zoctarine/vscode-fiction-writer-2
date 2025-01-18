export interface IProcessor<TIn, TOut> {
	process(data?: TIn): TOut
}

export interface IStateProcessor<TState> extends IProcessor<TState, Promise<void>> {

}

