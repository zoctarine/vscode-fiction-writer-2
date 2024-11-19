import {FwControl, FwInfo, FwType, IFwInfo} from '../../../core/fwFiles';
import {log} from '../../../core';

export interface IFileFilter {
    get key(): string;

    check(fileInfo?: IFwInfo): boolean;
}

export const OnlyProjectFilesFilter: IFileFilter = {
    key: 'projectFiles',
    check(item?: FwInfo): boolean {
        return item?.control === FwControl.Active ||
            item?.type === FwType.Folder;
    }
};
export const AllFilesFilter: IFileFilter = {
    key: 'allFiles',
    check(item?: FwInfo): boolean {
        return true;
    }
};