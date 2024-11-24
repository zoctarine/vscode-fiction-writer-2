import {FwEmpty, FwInfo, FwRootItem} from './FwInfo';
import {FsRefEmpty, IFsRef} from './IFsRef';
import {FsContentEmpty, IFsContent} from './IFsContent';
import {SimpleSuffixOrderParser} from './parsers';
import {ObjectProps} from '../lib';
import {FwItemBuilder} from './builders';
import {fwPath} from '../FwPath';

export class FwItem {
    constructor(public fsRef: IFsRef, public fsContent: IFsContent, public info: FwInfo) {
    }

    public children: string[] = [];
    public parent: string | undefined = undefined;
}

export class FwItemEmpty extends FwItem {
    constructor() {
        super(new FsRefEmpty(), new FsContentEmpty(), new FwEmpty());
    }
}


export class FwItemRoot extends FwItem {
    constructor() {
        super(new FsRefEmpty(), new FsContentEmpty(), new FwRootItem());
    }
}

export class FwItemTools {
    static nextOrder(info: FwInfo, step: number = 1): number[] {
        const orders = [...info.order ?? []];
        const order = orders.pop() ?? 1;
        return [...orders, order + step];
    }

    static nextSiblingName(info: FwInfo, step: number = 1): string {
        const s = new SimpleSuffixOrderParser();
        const parsed = s.parse(info.name);
        parsed.order = parsed.order?.length > 0
            ? [parsed.order[0] + step]
            : [step];
        return s.serialize(parsed);
    }

}


export class FwItemCloneBuilder {
    private _cloned: FwItem;
    private _original: FwItem;

    constructor(item: FwItem, private _fwItemBuilder: FwItemBuilder) {
        // Make a copy so we don't change the original
        this._cloned = ObjectProps.deepClone(item);
        this._original = ObjectProps.deepClone(item);
    }

    incrementFileOrder(step: number = 1): FwItemCloneBuilder {
        const orders = [...this._cloned.info.order ?? []];
        const order = orders.pop() ?? 0;
        this.setOrder([...orders, order + step]);
        return this;
    }

    incrementFilename(step: number = 1): FwItemCloneBuilder {
        const s = new SimpleSuffixOrderParser();
        const parsed = s.parse(this._cloned.info.name);
        parsed.order = parsed.order?.length > 0
            ? [parsed.order[0] + step]
            : [step];
        this.setFilename(s.serialize(parsed));
        return this;
    }

    setBasename(name: string): FwItemCloneBuilder {
        this._cloned.fsRef  = this._fwItemBuilder.fsPathToFsRef.parse(fwPath.join(this._original.fsRef.fsDir, name));

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
        this._cloned.info.order = order;
        this._cloned.fsRef = this._fwItemBuilder.fsRefToFwInfo.serialize(this._cloned.info, {
            rootFolderPaths: [],
            fsExt: this._cloned.fsRef.fsExt,
            fsDir: this._cloned.fsRef.fsDir
        });
        return this;
    }

    async clone(): Promise<FwItem> {
        const result = await this._fwItemBuilder.buildAsync({
            path: this._cloned.fsRef.fsPath,
            rootFolderPaths: [],
            isFile: this._original.fsRef.fsIsFile,
            isFolder: this._original.fsRef.fsIsFolder,
        });
        this.reset();
        return result;
    }

    reset(){
        this._cloned = ObjectProps.deepClone(this._original);
        return this;
    }
}

