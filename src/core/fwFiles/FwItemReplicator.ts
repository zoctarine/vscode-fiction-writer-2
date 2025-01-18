import {FwItemBuilder} from './builders';
import {ObjectProps} from '../lib';
import {fwPath} from '../FwPath';
import {FwItem} from './FwItem';
import {FwFormatting, FwMarkdownFileFormat} from '../markdown/formatting';

export class FwItemReplicator {
	private _cloned: FwItem;
	private readonly _original: FwItem;

	constructor(item: FwItem, private _fwItemBuilder: FwItemBuilder, private _opt?: {
		isFile?: boolean,
		isFolder?: boolean
	}) {
		// Make a copy so we don't change the original
		this._cloned = ObjectProps.deepClone(item);
		this._original = ObjectProps.deepClone(item);
		this._opt = {
			isFile: this._original.fsRef.fsIsFile,
			isFolder: this._original.fsRef.fsIsFolder,
			...this._opt
		};
	}

	incrementMainOrder(step: number = 1): FwItemReplicator {
		const orders = [...this._cloned.info.mainOrder.order ?? []];
		const order = orders.pop() ?? 0;
		this.withMainOrder([...orders, order + step]);
		return this;
	}

	incrementSubOrder(step: number = 1): FwItemReplicator {
		const orders = [...this._cloned.info.subOrder.order ?? []];
		const order = orders.pop() ?? 0;
		this.withSubOrder([...orders, order + step]);
		return this;
	}

	withBasename(name: string): FwItemReplicator {
		this._cloned.fsRef = this._fwItemBuilder.fsPathToFsRef.parse(fwPath.join(this._cloned.fsRef.fsDir, name), this._opt);
		this._cloned.info = this._fwItemBuilder.fsRefToFwInfo.parse(this._cloned.fsRef, {
			rootFolderPaths: []
		});
		return this;
	}

	withFilename(name: string): FwItemReplicator {
		this._cloned.info.name = name;
		this._update();
		return this;
	}

	withExt(ext: string): FwItemReplicator {
		this._cloned.info.ext = ext;
		this._update();
		return this;
	}

	withLocation(path: string): FwItemReplicator {
		this._cloned.info.location = path;
		this._update();
		return this;
	}

	withMainOrder(order: number[]): FwItemReplicator {
		this._cloned.info.mainOrder.order = order;
		this._update();
		return this;
	}

	withSubOrder(order: number[]): FwItemReplicator {
		this._cloned.info.subOrder.order = order;
		this._update();
		return this;
	}

	withFormat(format?: FwMarkdownFileFormat): FwItemReplicator {
		let data: string[] = [];
		if (format && format !== FwFormatting.defaultFormat) {
			const mark = FwFormatting.toMark(format);
			if (mark) data = [mark];
		}
		this._cloned.info.markers.data = data;
		this._update();
		return this;
	}

	async executeAsync(): Promise<FwItem> {
		const result = await this._fwItemBuilder.buildAsync({
			path: this._cloned.fsRef.fsPath,
			rootFolderPaths: [],
			isFile: this._opt?.isFile ?? this._original.fsRef.fsIsFile,
			isFolder: this._opt?.isFolder ?? this._original.fsRef.fsIsFolder,
		});
		this.reset();
		return result;
	}

	reset() {
		this._cloned = ObjectProps.deepClone(this._original);
		return this;
	}

	_update() {
		this._cloned.fsRef = this._fwItemBuilder.fsRefToFwInfo.serialize(this._cloned.info, {
			rootFolderPaths: []
		});
	}
}