const ViewsProjectExplorer = 'fictionWriter.views.projectExplorer';
const ViewsMetadata = 'fictionWriter.views.metadata';

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
            reorder: `${ViewsProjectExplorer}.reorder`,
            discard: `${ViewsProjectExplorer}.discard`,
            commit: `${ViewsProjectExplorer}.commit`,
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
};

