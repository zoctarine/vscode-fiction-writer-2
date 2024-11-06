import {FwControl, FwItem, FwType} from '../../../core/fwFiles';
import {log} from '../../../core';

export interface IFileFilter {
    get key(): string;

    check(fileInfo: FwItem): boolean;
}

export const OnlyProjectFilesFilter: IFileFilter = {
    key: 'projectFiles',
    check(item: FwItem): boolean {
        return item.control === FwControl.Active ||
            item.type === FwType.Folder;
    }
};
export const AllFilesFilter: IFileFilter = {
    key: 'allFiles',
    check(item: FwItem): boolean {
        return true;
    }
};