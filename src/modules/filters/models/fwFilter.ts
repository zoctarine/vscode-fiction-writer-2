
export class FwFilter {
    public static filterFolderNameRegExp = /^_fwf\.(text|meta.*)=(.+)$/i;
    public static isFilterFolderName(name: string) {
        return FwFilter.filterFolderNameRegExp.test(name);
    }

    public static tryParseFolderName(name: string) : {filter:string, value:string} | undefined {
        const match = FwFilter.filterFolderNameRegExp.exec(name);
        return match ? ({filter:match[1], value:match[2]}) : undefined;
    }
}