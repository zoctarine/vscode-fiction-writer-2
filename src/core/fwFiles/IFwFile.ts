/**
 * Represents an interface for file name metadata within a project.
 * It should not be modified.
 * A full name could look like:
 * {@link order} {@link name}.{@link projectTag}.{@link data}.{@link ext}
 *
 */
export interface IFwFile {
    /**
     * The file order extracted from filename. Multiple order numbers indicate a hierarchy
     */
    readonly order?: number[];

    readonly orderString?: string;

    /**
     * the file name before extracting order tokens
     */
    readonly orderedName: string;

    /**
     * The file name (without order, projectTag or data)
     * Trimmed {@link orderedName} after removing the {@link orderString}
     */
    readonly name: string;

    /**
     * If the filename contains the projectTag, then it is returned here.
     * If it is missing, the file does not belong to the project
     */
    readonly projectTag: string;

    /**
     * Optional data, extracted from filename
     */
    readonly data: string[];

    /**
     * The full extension, including projectTag and additional data (e.g. i for indented)
     */
    readonly ext: string;

    /**
     * The file extension as it appears in the file system. Including the '.'
     */
    readonly fsExt: string;

    /**
     * The file name as it appears in the file system. It can include order, project tag and data
     */
    readonly fsName: string;

    /**
     * The location (directory) from the fileSystem
     */
    readonly fsDir: string;

    /**
     * The full fsPath
     */
    readonly fsPath: string;

    /**
     * If the file exists on the fileSystem
     */
    readonly fsExists: boolean;
}