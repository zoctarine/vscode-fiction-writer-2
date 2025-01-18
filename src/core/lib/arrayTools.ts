export class ArrayTools {
	public static firstNotEmpty<T>(...all: ((T | undefined)[] | undefined)[]): T[] {
		for (const item of all) {
			if (item && item.length > 0) {
				const notEmpty = item.filter(i => i !== undefined && i !== null);
				if (notEmpty.length > 0) {
					return notEmpty;
				}
			}
		}
		return [];
	};
}