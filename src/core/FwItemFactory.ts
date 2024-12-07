import {
    FwItemBuilder,
    FwPermission,
    Permissions,
} from './index';
import {FwItem, FwItemCloneBuilder} from './fwFiles/FwItem';
import {StateManager} from './state';
import {fwPath} from './FwPath';

export class FwItemFactory {
    constructor(private _stateManager: StateManager,
                private _fwItemBuilder: FwItemBuilder) {
    };

    public async createChildItem(item: FwItem) {
        if (!Permissions.check(item.info, FwPermission.AddChildFile)) return;

        const nextOrder = this._fwItemBuilder.fsRefToFwInfo.mainOrderParser.computeNextOrderFor(
            item.children?.map(c => fwPath.parse(c).name) ?? [],
            item.info.mainOrder.order
        );
        return await new FwItemCloneBuilder(item, this._fwItemBuilder,
            {isFile: true, isFolder: false})
            .setFilename("new")
            .appendToPath(item.fsRef.fsName)
            .setOrder([...item.info.mainOrder.order, nextOrder])
            .clone();
    }

    public async createVirtualChildItem(item: FwItem) {
        if (!Permissions.check(item.info, FwPermission.AddVirtualChild)) return;

        const parent = this._stateManager.get(item.parent)?.fwItem;
        if (!parent) return;

        const nextOrder = this._fwItemBuilder.fsRefToFwInfo.mainOrderParser.computeNextOrderFor(
            item.children?.map(c => fwPath.parse(c).name) ?? [],
            item.info.mainOrder.order
        );

        return await new FwItemCloneBuilder(item, this._fwItemBuilder,
            {isFile: true, isFolder: false})
            .setFilename("new")
            .setOrder([...item.info.mainOrder.order, nextOrder])
            .clone();

    }

    public async createSiblingItem(item: FwItem): Promise<FwItem | undefined> {
        if (!Permissions.check(item.info, FwPermission.AddSiblings)) {
            return;
        }

        const parent = this._stateManager.get(item.parent)?.fwItem;
        if (!parent) return;

        // TODO: improve upon this
        const siblings = await Promise.all(
            parent.children?.map(c => this._fwItemBuilder.buildAsync({path: c, rootFolderPaths: []}))
        );

        const orderedNames = siblings
            .filter(s => s.info.name.toLowerCase() === item.info.name.toLowerCase()) ?? [];
        const baseOrder = item.info.subOrder.order.slice(0, -1) ?? [];

        const nextFileOrder = orderedNames
            .filter(n => n.info.subOrder.order.join('.').startsWith(baseOrder.join('.')))
            .map(n => n.info.subOrder.order.slice(baseOrder.length-1))
            .reduce((max, crt) => Math.max(max, crt[0] ?? 0), 0) + 1;

        return await new FwItemCloneBuilder(item, this._fwItemBuilder, {isFile: true, isFolder: false})
           // .incrementMainOrder()
            .setSubOrder([...baseOrder, nextFileOrder])
            .clone();
    }
}
