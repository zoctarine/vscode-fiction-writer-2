import {FwControl, FwFileInfo, FwType} from '../../core/fwFiles';

export interface IFileFilter {
    get key(): string;

    check(fileInfo: FwFileInfo): boolean;
}

export const OnlyProjectFilesFilter: IFileFilter = {
    key: 'projectFiles',
    check(fileInfo: FwFileInfo): boolean {
        return fileInfo.control === FwControl.Active ||
            fileInfo.type === FwType.Folder;
    }
};
export const AllFilesFilter: IFileFilter = {
    key: 'allFiles',
    check(fileInfo: FwFileInfo): boolean {
        return true;
    }
};