import {ProjectNode} from './projectNode';
import {FwControl, FwPermission, FwSubType, FwType, IBuilder, Permissions} from '../../../core';
import {IProjectContext} from './IProjectContext';

export interface IProjectNodeContext {
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


export class ProjectNodeContextBuilder implements IBuilder<{
    ctx: IProjectContext,
    node: ProjectNode
}, IProjectNodeContext> {
    build({ctx, node}: { ctx: IProjectContext, node: ProjectNode }): IProjectNodeContext {
        let none = {
            compile: false,
            compileCommit: false,
            compileDiscard: false,
            compileChildrenInclude: false,
            compileChildrenExclude: false,

            exclude: false,
            include: false,

            newFile: false,
            newFolder: false,

            move: false,
            rename: false,
            delete: false,

            reorder: false,
            reorderCommit: false,
            reorderDiscard: false,
            reorderUp: false,
            reorderDown: false,
            redistribute: false,

            reveal: false,
            toggleVirtual: false,
            combine: false,

            debug: false
        };

        switch (ctx.is) {
            case "ordering":
                return {
                    ...none,
                    reorderCommit: true,
                    reorderDiscard: true,
                    reorderUp: true,
                    reorderDown: true,
                    redistribute: true
                };
            case "compiling":
                return {
                    ...none,
                    compileCommit: true,
                    compileDiscard: true,
                    compileChildrenInclude: node.data.fwItem?.ref?.type === FwType.Folder,
                    compileChildrenExclude: node.data.fwItem?.ref?.type === FwType.Folder,
                };
            default:
                return {
                    ...none,
                    compile: true,
                    delete: node.canDelete,
                    exclude: (node.data.fwItem?.ref.fsExists && node.data.fwItem?.ref?.control === FwControl.Active) ?? false,
                    include: node.data.fwItem?.ref?.control === FwControl.Possible,
                    move: node.canMove,
                    newFile: true,
                    newFolder: true,
                    rename: node.canEdit,
                    reorder: Permissions.check(node.data.fwItem?.ref, FwPermission.Sort),
                    reveal: node.data.fwItem?.ref.fsExists ?? false,
                    toggleVirtual: Permissions.check(node.data.fwItem?.ref, FwPermission.Morph) && node.children.length === 0,
                    combine: node.data.fwItem?.ref?.subType === FwSubType.ProjectFile ?? false,
                    debug: true
                };
        }
    }
}