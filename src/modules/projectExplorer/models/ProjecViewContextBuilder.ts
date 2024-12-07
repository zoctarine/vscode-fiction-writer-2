import {IBuilder} from '../../../core';
import {IProjectContext, ProjectView} from './IProjectContext';
import {IProjectViewContext} from './IProjectViewContext';

export class ProjectViewContextBuilder implements IBuilder<{
    ctx: IProjectContext
}, Partial<IProjectViewContext>> {
    build({ctx}: { ctx: IProjectContext }): Partial<IProjectViewContext> {
        let vmChanges: Partial<IProjectViewContext> = {};
        switch (ctx.is) {
            case "ordering":
                vmChanges = {
                    decoration: undefined,
                    filter: undefined,
                    compileStart: undefined,
                    compileCommit: undefined,
                    compileDiscard: undefined,
                    newFile: undefined,
                    newFolder: undefined,
                    orderStart: undefined,
                    orderCommit: true,
                    orderDiscard: true,
                    refresh: undefined,
                    sync: undefined,
                    showExtension: undefined,
                    showOrder: undefined,
                    back: undefined,
                };
                break;
            case "compiling":
                vmChanges = {
                    decoration: undefined,
                    filter: undefined,
                    compileStart: undefined,
                    compileCommit: true,
                    compileDiscard: true,
                    newFile: undefined,
                    newFolder: undefined,
                    orderStart: undefined,
                    orderCommit: undefined,
                    orderDiscard: undefined,
                    refresh: undefined,
                    sync: undefined,
                    showExtension: undefined,
                    showOrder: undefined,
                    back: undefined,
                    projectView: undefined,
                };
                break;
            default :
                vmChanges = {
                    decoration: ctx.decoration,
                    filter: ctx.filter,
                    compileStart: true,
                    compileCommit: undefined,
                    compileDiscard: undefined,
                    newFile: true,
                    newFolder: true,
                    orderStart: true,
                    orderCommit: undefined,
                    orderDiscard: undefined,
                    refresh: true,
                    sync: ctx.syncEditor ? 'on' : 'off',
                    back: ctx.navigationRoot !== undefined && ctx.projectView === ProjectView.tree,

                    projectView: ctx.projectView,
                    showExtension: ctx.showExtension ? 'on' : 'off',
                    showOrder: ctx.showOrder ? 'on' : 'off',
                };
                break;
        }

        return vmChanges;
    }
}