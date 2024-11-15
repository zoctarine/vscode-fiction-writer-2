import {ICommand, FactorySwitch} from '../../lib';
import {
    FwEmpty,
    FwFolderItem,
    FwRef,
    FwOtherFileItem,
    FwProjectFileItem,
    FwTextFileItem,
    FwWorkspaceFolderItem
} from '../FwRef';
import {IFwRef} from '../IFwRef';

export class BuildFwRef implements ICommand<{ ref: IFwRef, rootFolderPaths: string[] }, FwRef > {
    private _fileExtensions = ['.md', '.txt'];

    run(args: { ref: IFwRef, rootFolderPaths: string[] }) {
        if (!args.ref) return new FwEmpty();
        if (!args.rootFolderPaths) return new FwEmpty();

        const {ref, rootFolderPaths} = args;

        const isWorkspaceFolder = ref.fsIsFolder && rootFolderPaths.includes(ref.fsPath);
        const isTextFile = ref.fsIsFile && this._fileExtensions.includes(ref.fsExt);
        const isProjectFile = ref.fsIsFile && ref.projectTag.length > 0 && isTextFile;
        const result = new FactorySwitch<FwRef>()
            .case(isWorkspaceFolder, () => new FwWorkspaceFolderItem(ref))
            .case(ref.fsIsFolder, () => new FwFolderItem(ref))
            .case(isProjectFile, () => new FwProjectFileItem(ref))
            .case(isTextFile, () => new FwTextFileItem(ref))
            .default(() => new FwOtherFileItem(ref))
            .create();

        const {order = []} = ref;
        result.currentOrder = order.pop() ?? 0;
        result.parentOrder = order;
        result.orderBy = ref.orderedName;

        return result;
    }
}