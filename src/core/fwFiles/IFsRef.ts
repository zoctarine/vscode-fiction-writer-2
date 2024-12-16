import {IFsContent} from './IFsContent';

/**
 * Represents an interface for file name metadata within a project.
 * It should not be modified.

 *
 */
export interface IFsRef {
    /**
     * The file extension as it appears in the file system. Including the '.'
     */
    readonly fsExt: string;

    /**
     * The file name as it appears in the file system. It can include order, project tag and data
     */
    readonly fsName: string;

    /**
     * The file name as it appears in the file system. It includes full name + extension
     */
    readonly fsBaseName: string;

    /**
     * The location (directory) from the fileSystem
     */
    readonly fsDir: string;

    /**
     * The full fsPath
     */
    readonly fsPath: string;

    /**
     * The type of the resource (folder or file)
     */
    readonly fsIsFile: boolean;
    readonly fsIsFolder: boolean;

    /**
     * If the file exists on the fileSystem
     */
    fsExists: boolean;

    readonly fsModifiedDate: number | undefined;
}

export class FsRefEmpty implements IFsRef{
    fsExt: string = '';
    fsName: string = '';
    fsBaseName: string = '';
    fsDir: string = '';
    fsPath: string = '';
    fsIsFile: boolean = false;
    fsIsFolder: boolean = false;
    fsExists: boolean = false;
    fsModifiedDate: number | undefined;
}