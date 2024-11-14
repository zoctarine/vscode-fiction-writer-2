export interface ICommand<TIn, TOut> {
    run(input?: TIn): TOut
}

export interface IAsyncCommand<TIn, TOut> {
    runAsync(input?: TIn): Promise<TOut>
}
