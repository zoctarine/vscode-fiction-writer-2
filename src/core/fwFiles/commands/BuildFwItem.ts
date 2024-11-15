import {ICommand, FactorySwitch} from '../../lib';
import {
    FwEmpty,
    FwFolderItem,
    FwItem,
    FwOtherFileItem,
    FwProjectFileItem,
    FwTextFileItem,
    FwWorkspaceFolderItem
} from '../FwItem';
import {FwFile} from '../FwFile';

export class BuildFwItem implements ICommand<{ fwFile: FwFile, rootFolderPaths: string[] }, FwItem > {
    private _fileExtensions = ['.md', '.txt'];

    run(args: { fwFile: FwFile, rootFolderPaths: string[] }) {
        if (!args.fwFile) return new FwEmpty();
        if (!args.rootFolderPaths) return new FwEmpty();

        const {fwFile: {ref}, fwFile, rootFolderPaths} = args;

        const isWorkspaceFolder = ref.fsIsFolder && rootFolderPaths.includes(ref.fsPath);
        const isTextFile = ref.fsIsFile && this._fileExtensions.includes(ref.fsExt);
        const isProjectFile = ref.fsIsFile && ref.projectTag.length > 0 && isTextFile;
        const result = new FactorySwitch<FwItem>()
            .case(isWorkspaceFolder, () => new FwWorkspaceFolderItem(fwFile))
            .case(ref.fsIsFolder, () => new FwFolderItem(fwFile))
            .case(isProjectFile, () => new FwProjectFileItem(fwFile))
            .case(isTextFile, () => new FwTextFileItem(fwFile))
            .default(() => new FwOtherFileItem(fwFile))
            .create();

        const {order = []} = ref;
        result.order = order.pop() ?? 0;
        result.parentOrder = order;
        result.orderBy = ref.orderedName;

        return result;
    }
}