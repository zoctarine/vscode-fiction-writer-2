export interface IList<T> {
    sort(): IList<T>;

    filter(): IList<T>;

    items: T[];
}