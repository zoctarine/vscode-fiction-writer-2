export interface IBuilder<TIn, TOut> {
    build(input: TIn): TOut;
}