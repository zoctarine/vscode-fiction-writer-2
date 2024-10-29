export interface IProcessor<T, TIn, TOut> {
    process(content: T, data?: TIn): TOut
}

export interface ITextProcessor<TState> extends IProcessor<string, TState, Promise<string>> {

}

