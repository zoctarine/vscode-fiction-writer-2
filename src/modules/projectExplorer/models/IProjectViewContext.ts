export interface IProjectViewContext {
    // Title menu
    decoration: string | undefined;
    newFile: boolean;
    newFolder: boolean;
    filter: string | undefined;
    sync: string | undefined;
    orderStart: boolean;
    orderDiscard: boolean;
    orderCommit: boolean;
    compileStart: boolean;
    compileDiscard: boolean;
    compileCommit: boolean;
    orderUp: boolean;
    orderDown: boolean;
    refresh: boolean;
    back: boolean;

    // Context Menu
    showExtension: string;
    showOrder: string;
    projectView: string | undefined;
}
