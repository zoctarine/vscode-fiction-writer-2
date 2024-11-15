import {FwControl, FwRef, FwType, IFwProjectRef} from '../../../core/fwFiles';
import {log} from '../../../core';

export interface IFileFilter {
    get key(): string;

    check(fileInfo: IFwProjectRef): boolean;
}

export const OnlyProjectFilesFilter: IFileFilter = {
    key: 'projectFiles',
    check(item: FwRef): boolean {
        return item.control === FwControl.Active ||
            item.type === FwType.Folder;
    }
};
export const AllFilesFilter: IFileFilter = {
    key: 'allFiles',
    check(item: FwRef): boolean {
        return true;
    }
};