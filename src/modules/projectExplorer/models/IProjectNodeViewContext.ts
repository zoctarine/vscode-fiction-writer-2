export interface IProjectNodeViewContext {
    // inline
    open: boolean;

    // context menu
    rename: boolean;
    delete: boolean;
    move: boolean;

    newFile: boolean;
    newFolder: boolean;
    toggleVirtual: boolean;

    compile: boolean;
    compileCommit: boolean,
    compileDiscard: boolean,
    compileChildrenInclude: boolean,
    compileChildrenExclude: boolean,

    reorder: boolean;
    reorderCommit: boolean;
    reorderDiscard: boolean;
    reorderUp: boolean;
    reorderDown: boolean;
    redistribute: boolean;

    include: boolean;
    exclude: boolean;

    reveal: boolean;

    combine: boolean;

    debug: boolean;
}


