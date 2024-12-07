import {FwControl, FwPermission, FwSubType, FwType, IBuilder, Permissions} from '../../../core';
import {IProjectContext, ProjectView} from './IProjectContext';
import {ProjectNode} from './projectNode';
import {IProjectNodeViewContext} from './IProjectNodeViewContext';

export class ProjectNodeViewContextBuilder implements IBuilder<{
    ctx: IProjectContext,
    node: ProjectNode
}, IProjectNodeViewContext> {
    build({ctx, node}: { ctx: IProjectContext, node: ProjectNode }): IProjectNodeViewContext {
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

            open: false,

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


        const info = node.data.fwItem?.info;
        const fsRef = node.data.fwItem?.fsRef;
        if (!info) return none;

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
                    compileChildrenInclude: info.type === FwType.Folder,
                    compileChildrenExclude: info.type === FwType.Folder,
                };
            default:
                return {
                    ...none,
                    compile: true,
                    open: node.acceptsVirtualChildren && ctx.projectView === ProjectView.list,
                    delete: node.canDelete,
                    exclude: (fsRef?.fsExists && info.control === FwControl.Active) ?? false,
                    include: info.control === FwControl.Possible,
                    move: node.canMove,
                    newFile: node.acceptsType(FwSubType.ProjectFile) || Permissions.check(info, FwPermission.AddSiblings),
                    newFolder: node.acceptsType(FwSubType.Folder),
                    rename: node.canEdit,
                    reorder: Permissions.check(info, FwPermission.Sort),
                    reveal: fsRef?.fsExists ?? false,
                    toggleVirtual: Permissions.check(info, FwPermission.Morph) && node.children.length === 0,
                    combine: info.subType === FwSubType.ProjectFile ?? false,
                    debug: true,
                };
        }
    }
}