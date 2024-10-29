import {FwControl, FwItem, FwType} from '../../core/fwFiles';

export interface IFileFilter {
    get key(): string;

    check(fileInfo: FwItem): boolean;
}

export const OnlyProjectFilesFilter: IFileFilter = {
    key: 'projectFiles',
    check(fileInfo: FwItem): boolean {
        return fileInfo.control === FwControl.Active ||
            fileInfo.type === FwType.Folder;
    }
};
export const AllFilesFilter: IFileFilter = {
    key: 'allFiles',
    check(fileInfo: FwItem): boolean {
        return true;
    }
};