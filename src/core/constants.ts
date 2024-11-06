const ViewsProjectExplorer = 'fictionWriter.views.projectExplorer';
const ViewsMetadata = 'fictionWriter.views.metadata';
const Security = 'fictionWriter.security';
const Compile = 'fictionWriter.compile';
const Files = 'fictionWriter.files';


export const FictionWriter = {
    explorer: {
        revealInProjectsView: 'explorer.revealInProjectsView',
    },
    files: {
        split: `${Files}.split`,
        combine: `${Files}.combine`,
    },
    views: {
        projectExplorer: {
            id: `${ViewsProjectExplorer}`,
            ctx: `${ViewsProjectExplorer}.ctx`,
            vm: `${ViewsProjectExplorer}.vm`,
            newFile: `${ViewsProjectExplorer}.newFile`,
            newFolder: `${ViewsProjectExplorer}.newFolder`,
            rename: `${ViewsProjectExplorer}.rename`,
            trash: `${ViewsProjectExplorer}.trash`,
            addToProject: `${ViewsProjectExplorer}.addToProject`,
            excludeFromProject: `${ViewsProjectExplorer}.excludeFromProject`,
            toggleVirtualFolder: `${ViewsProjectExplorer}.toggleVirtualFolder`,
            revealInExplorer: `${ViewsProjectExplorer}.revealInExplorer`,
            filters: {
                allFiles: `${ViewsProjectExplorer}.filters.allFiles`,
                projectFiles: `${ViewsProjectExplorer}.filters.projectFiles`,
            },
            show:{
                decoration1: `${ViewsProjectExplorer}.show.decoration1`,
                decoration2: `${ViewsProjectExplorer}.show.decoration2`,
                decoration3: `${ViewsProjectExplorer}.show.decoration3`,
                decoration4: `${ViewsProjectExplorer}.show.decoration4`,
            },
            reorder:{
                start: `${ViewsProjectExplorer}.reorder.start`,
                discard: `${ViewsProjectExplorer}.reorder.discard`,
                commit: `${ViewsProjectExplorer}.reorder.commit`,
                redistribute: `${ViewsProjectExplorer}.reorder.redistribute`,
            },
            sync: {
                on: `${ViewsProjectExplorer}.sync.on`,
                off: `${ViewsProjectExplorer}.sync.off`,
            },
            compile: {
                startHere: `${ViewsProjectExplorer}.compile.startHere`,
                commit: `${ViewsProjectExplorer}.compile.commit`,
                discard: `${ViewsProjectExplorer}.compile.discard`,
            },
            debug: {
                stateDump: `${ViewsProjectExplorer}.debug.stateDump`,
            }
        },
        metadata: {
            id: `${ViewsMetadata}`,
            isLinked: `${ViewsMetadata}.isLinked`,
            editSingle: `${ViewsMetadata}.editValue`,
            filters: {
                setFileDescriptionMetadataKey: `${ViewsMetadata}.filters.setFileDescriptionMetadataKey`
            }
        }
    },
    security:{
        exportKeys: `${Security}.exportKeys`,
    }
};

