const ViewsProjectExplorer = 'fictionWriter.views.projectExplorer';
const ViewsMetadata = 'fictionWriter.views.metadata';
const Security = 'fictionWriter.security';

export const FictionWriter = {
    views: {
        projectExplorer: {
            id: `${ViewsProjectExplorer}`,
            isOrdering: `${ViewsProjectExplorer}.isOrdering`,
            newFile: `${ViewsProjectExplorer}.newFile`,
            newFolder: `${ViewsProjectExplorer}.newFolder`,
            rename: `${ViewsProjectExplorer}.rename`,
            trash: `${ViewsProjectExplorer}.trash`,
            makeVirtualFolder: `${ViewsProjectExplorer}.makeVirtualFolder`,
            breakVirtualFolder: `${ViewsProjectExplorer}.breakVirtualFolder`,
            reorder:{
                start: `${ViewsProjectExplorer}.reorder.start`,
                discard: `${ViewsProjectExplorer}.reorder.discard`,
                commit: `${ViewsProjectExplorer}.reorder.commit`,
                redistribute: `${ViewsProjectExplorer}.reorder.redistribute`,
            },
            sync: {
                on: `${ViewsProjectExplorer}.sync.on`,
                off: `${ViewsProjectExplorer}.sync.off`,
                isOn: `${ViewsProjectExplorer}.sync.isOn`,
            },
        },
        metadata: {
            id: `${ViewsMetadata}`,
            isLinked: `${ViewsMetadata}.isLinked`
        }
    },
    security:{
        exportKeys: `${Security}.exportKeys`,
    },
};

