/**
 * Represents an interface for file metadata within a project.
 * A full name could look like:
 * {@link order} {@link name}.{@link projectTag}.{@link data}.{@link ext}
 *
 */
export interface IFwFile {
    /**
     * The file order extracted from filename. Multiple order numbers indicate a hierarchy
     */
    order?: number[]

    /**
     * the file name before extracting order tokens
     */
    orderedName: string;

    /**
     * The file name (without order, projectTag or data)
     */
    name: string;

    /**
     * If the filename contains the projectTag, then it is returned here.
     * If it is missing, the file does not belong to the project
     */
    projectTag?: string;

    /**
     * Optional data, extracted from filename
     */
    data: string[];

    /**
     * The full extension, including projectTag and additional data (e.g. i for indented)
     */
    ext: string;

    /**
     * The file extension as it appears in the file system. Including the '.'
     */
    fsExt: string;

    /**
     * The file name as it appears in the file system. It can include order, project tag and data
     */
    fsName: string;

    /**
     * The location (directory) from the fileSystem
     */
    fsDir: string;

    /**
     * The full fsPath
     */
    fsPath: string;
}