import {
    FwFileManager,
    FwItemBuilder,
    FwPermission,
    FwType,
    IAsyncCommand,
    log,
    Permissions,
    SuffixOrderParser
} from '../../../core';
import {FwItem, FwItemCloneBuilder} from '../../../core/fwFiles/FwItem';
import {StateManager} from '../../../core/state';
import {fwPath} from '../../../core/FwPath';
import {FwItemFactory} from '../../../core/FwItemFactory';

export class AddChildFile implements IAsyncCommand<FwItem, string | undefined> {
    constructor(private _fileManager: FwFileManager,
                private _itemFactory: FwItemFactory) {
    };

    async runAsync(item?: FwItem) {
        if (!item) return;

        let newItem = await this._itemFactory.createChildItem(item)
            ?? await this._itemFactory.createVirtualChildItem(item)
            ?? await this._itemFactory.createSiblingItem(item);

        if (!newItem) return;

        if (await this._fileManager.createFile(newItem.fsRef.fsPath, '')) {
            return newItem.fsRef.fsPath;
        } else {
            console.error(`Cannot create ${newItem.fsRef.fsPath}`);
        }

        return undefined;
    }
}
