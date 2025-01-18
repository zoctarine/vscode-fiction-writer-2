export interface Collections<T> {
	sort(): Collections<T>;

	filter(): Collections<T>;

	items: T[];
}