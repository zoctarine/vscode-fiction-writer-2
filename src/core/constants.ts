const ViewsProjectExplorer = 'fictionWriter.views.projectExplorer';
const ViewsMetadata = 'fictionWriter.views.metadata';
const Security = 'fictionWriter.security';
const Compile = 'fictionWriter.compile';

export const FictionWriter = {
    views: {
        projectExplorer: {
            id: `${ViewsProjectExplorer}`,
            is: `${ViewsProjectExplorer}.is`,
            newFile: `${ViewsProjectExplorer}.newFile`,
            newFolder: `${ViewsProjectExplorer}.newFolder`,
            rename: `${ViewsProjectExplorer}.rename`,
            trash: `${ViewsProjectExplorer}.trash`,
            makeVirtualFolder: `${ViewsProjectExplorer}.makeVirtualFolder`,
            breakVirtualFolder: `${ViewsProjectExplorer}.breakVirtualFolder`,
            show:{
                decoration1: `${ViewsProjectExplorer}.show.decoration1`,
                decoration2: `${ViewsProjectExplorer}.show.decoration2`,
                decoration3: `${ViewsProjectExplorer}.show.decoration3`,
                decoration4: `${ViewsProjectExplorer}.show.decoration4`,
                decorationIs: `${ViewsProjectExplorer}.show.decorationIs`,
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
                isOn: `${ViewsProjectExplorer}.sync.isOn`,
            },
            compile: {
                startHere: `${ViewsProjectExplorer}.compile.startHere`,
                commit: `${ViewsProjectExplorer}.compile.commit`,
                discard: `${ViewsProjectExplorer}.compile.discard`,
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

