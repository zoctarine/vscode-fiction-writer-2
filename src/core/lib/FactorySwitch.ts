/**
 * Factory for creating objects based on condition.
 * The {@link case} {@link when} expressions are evaluated in the order they are added
 * The first match will be chosen to create the object.
 */
export class FactorySwitch<T> {
	_builders: { create: () => T, when: boolean | (() => boolean) }[] = [];


	default(create: () => T): FactorySwitch<T> {
		this._builders.push({create, when: true});
		return this;
	}

	case(when: boolean | (() => boolean),
		 create: () => T): FactorySwitch<T> {
		this._builders.push({create, when});
		return this;
	}

	create(): T {
		for (let builder of this._builders) {
			if (builder.when === true || (typeof builder.when === 'function' && builder.when())) {
				return builder.create();
			}
		}

		throw new Error(`No suitable builder found`);
	}


}