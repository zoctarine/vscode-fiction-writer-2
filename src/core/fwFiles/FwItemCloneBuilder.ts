import {FwItemBuilder} from './builders';
import {ObjectProps} from '../lib';
import {fwPath} from '../FwPath';
import {FwItem} from './FwItem';

export class FwItemCloneBuilder {
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

    incrementMainOrder(step: number = 1): FwItemCloneBuilder {
        const orders = [...this._cloned.info.mainOrder.order ?? []];
        const order = orders.pop() ?? 0;
        this.setOrder([...orders, order + step]);
        return this;
    }

    incrementSubOrder(step: number = 1): FwItemCloneBuilder {
        const orders = [...this._cloned.info.subOrder.order ?? []];
        const order = orders.pop() ?? 0;
        this.setSubOrder([...orders, order + step]);
        return this;
    }

    appendToPath(name: string): FwItemCloneBuilder {
        this._cloned.fsRef = this._fwItemBuilder.fsPathToFsRef.parse(
            fwPath.join(this._cloned.fsRef.fsDir, name, this._cloned.fsRef.fsBaseName), this._opt);
        this._cloned.info = this._fwItemBuilder.fsRefToFwInfo.parse(this._cloned.fsRef, {
            rootFolderPaths: []
        });
        return this;
    }

    setBasename(name: string): FwItemCloneBuilder {
        this._cloned.fsRef = this._fwItemBuilder.fsPathToFsRef.parse(fwPath.join(this._cloned.fsRef.fsDir, name), this._opt);
        this._cloned.info = this._fwItemBuilder.fsRefToFwInfo.parse(this._cloned.fsRef, {
            rootFolderPaths: []
        });
        return this;
    }

    setFilename(name: string): FwItemCloneBuilder {
        this._cloned.info.name = name;
        this._cloned.fsRef = this._fwItemBuilder.fsRefToFwInfo.serialize(this._cloned.info, {
            rootFolderPaths: [],
            fsExt: this._cloned.fsRef.fsExt,
            fsDir: this._cloned.fsRef.fsDir
        });
        return this;
    }

    setOrder(order: number[]): FwItemCloneBuilder {
        this._cloned.info.mainOrder.order = order;
        this._cloned.fsRef = this._fwItemBuilder.fsRefToFwInfo.serialize(this._cloned.info, {
            rootFolderPaths: [],
            fsExt: this._cloned.fsRef.fsExt,
            fsDir: this._cloned.fsRef.fsDir,
        });
        return this;
    }

    setSubOrder(order: number[]): FwItemCloneBuilder {
        // TODO: Defaults?
        if (this._cloned.info.subOrder.order?.length === 0) {
            this._cloned.info.subOrder.glue = ' ';
            this._cloned.info.subOrder.sep = '.';
        }
        this._cloned.info.subOrder.order = order;

        this._cloned.fsRef = this._fwItemBuilder.fsRefToFwInfo.serialize(this._cloned.info, {
            rootFolderPaths: [],
            fsExt: this._cloned.fsRef.fsExt,
            fsDir: this._cloned.fsRef.fsDir,
        });
        return this;
    }

    async clone(): Promise<FwItem> {

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
}