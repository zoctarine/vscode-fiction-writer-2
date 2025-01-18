import rfdc from 'rfdc';

const clone = rfdc();

export class ObjectProps {
	public static deepClone(obj: any) {
		return clone(obj);
	}


	public static async updateAsync<T extends Record<string, any>>(crt: T, opt: {
		onProperty: (key: keyof T) => Promise<any>
	}) {
		const next = clone(crt) as any;
		for (const key of Object.keys(crt)) {
			next[key] = await opt.onProperty(key);
		}
		Object.assign(crt, next);
	}

	public static async patchAsync<T extends Record<string, any>>(crt: T, changes: Partial<T>, opt?:
	{
		onSinglePropertyChange?: (key: keyof T, value: any) => Promise<any>,
		onProperty?: (key: keyof T, value: any) => Promise<any>,
		onAnyPropertyChange?: (next: T) => Promise<T>,
	}) {
		const prev = clone(crt);
		const next = {...prev, ...changes};
		let isDirty = false;
		for (const key of Object.keys(crt)) {
			if (opt?.onProperty) await opt.onProperty(key, next[key]);

			if (prev[key] !== next[key]) {
				isDirty = true;
				if (opt?.onSinglePropertyChange) await opt.onSinglePropertyChange(key, next[key]);
			}
		}

		if (isDirty && opt?.onAnyPropertyChange) {
			await opt.onAnyPropertyChange(crt);
		}
		Object.assign(crt, next);
	}
}