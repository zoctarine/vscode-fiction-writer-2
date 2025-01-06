import {
    FwItemBuilder,
    FwPermission,
    Permissions,
} from './index';
import {FwItem} from './fwFiles/FwItem';
import {StateManager} from './state';
import {fwPath} from './FwPath';
import {FwItemReplicator} from './fwFiles/FwItemReplicator';
import {WorkerMsgJobProgress} from '../worker/models';

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
        return await new FwItemReplicator(item, this._fwItemBuilder,
            {isFile: true, isFolder: false})
            .withFilename("new")
            .withLocation(item.fsRef.fsPath)
            .withMainOrder([...item.info.mainOrder.order, nextOrder])
            .executeAsync();
    }

    public async createVirtualChildItem(item: FwItem) {
        if (!Permissions.check(item.info, FwPermission.AddVirtualChild)) return undefined;

        const parent = this._stateManager.get(item.parent)?.fwItem;
        if (!parent) return;

        const nextOrder = this._fwItemBuilder.fsRefToFwInfo.mainOrderParser.computeNextOrderFor(
            item.children?.map(c => fwPath.parse(c).name) ?? [],
            item.info.mainOrder.order
        );

        return await new FwItemReplicator(item, this._fwItemBuilder,
            {isFile: true, isFolder: false})
            .withFilename("new")
            .withMainOrder([...item.info.mainOrder.order, nextOrder])
            .executeAsync();
    }

    private async NextChildOrder(parent: FwItem, orderSelector: (fwItem: FwItem) => number[]) {
        if (!parent) return;

        // Read all fs children
        const siblingPaths = await fwPath.getChildrenAsync(parent.fsRef.fsPath);
        const siblings: FwItem[] = [];
        for (const p of siblingPaths) {
            siblings.push(await this._fwItemBuilder.buildAsync({path: p, rootFolderPaths: []}));
        }
        // Get parent order...
        const orders = siblings.map(s => orderSelector(s));
    }


    public async createSiblingItem(item: FwItem): Promise<FwItem | undefined> {
        if (!Permissions.check(item.info, FwPermission.AddSiblings)) {
            return;
        }

        const parent = this._stateManager.get(item.fsRef.fsDir)?.fwItem;
        if (!parent) return;

        const siblingPaths = await fwPath.getChildrenAsync(parent.fsRef.fsPath);
        const siblings: FwItem[] = [];
        // TODO: improve upon this
        for (const p of siblingPaths) {
            siblings.push(await this._fwItemBuilder.buildAsync({path: p, rootFolderPaths: []}));
        }

        const orderedNames = siblings
            .filter(s =>
                s.info.name.toLowerCase() === item.info.name.toLowerCase() &&
                s.info.mainOrder.order.join('.') === item.info.mainOrder.order.join('.')) ?? [];
        const baseOrder = [...item.info.subOrder.order];
        const lastOrder = baseOrder.pop() ?? 1;

        const nextFileOrder = orderedNames
            .filter(n => n.info.subOrder.order.join('.').startsWith(baseOrder.join('.')))
            .map(n => n.info.subOrder.order.slice(baseOrder.length - 1))
            .reduce((max, crt) => Math.max(max, crt[0] ?? 0), 0) + 1;

        const nextOrder = (nextFileOrder ===lastOrder+1)
            ? [...baseOrder, nextFileOrder]
            : [...baseOrder, lastOrder, 1];

        return await new FwItemReplicator(item, this._fwItemBuilder, {isFile: true, isFolder: false})
            .withSubOrder(nextOrder)
            .executeAsync();
    }
}
