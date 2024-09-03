export interface IProcessor<T, TState> {
    process(content: T, data: TState): Promise<T>
}

export interface ITextProcessor<TState> extends IProcessor<string, TState> {

}