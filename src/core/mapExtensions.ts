/**
 * Converts a Map to a plain JavaScript object.
 * @param map - The Map to be converted.
 * @returns The resulting plain JavaScript object.
 */
export function mapToObject<V>(map: Map<string, V>): { [key: string]: V } {
	const obj: { [key: string]: V } = {};
	for (const [key, value] of map.entries()) {
		obj[key] = value;
	}
	return obj;
}

/**
 * Converts a plain JavaScript object to a Map.
 * @param obj - The object to be converted.
 * @returns The resulting Map.
 */
export function objectToMap<V>(obj: { [key: string]: V }): Map<string, V> {
	const map = new Map<string, V>();
	for (const [key, value] of Object.entries(obj)) {
		map.set(key, value);
	}
	return map;
}