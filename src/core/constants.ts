const ViewsProjectExplorer = 'fictionWriter.views.projectExplorer';
const ViewsMetadata = 'fictionWriter.views.metadata';
const Security = 'fictionWriter.security';
const Compile = 'fictionWriter.compile';
const Files = 'fictionWriter.files';
const Formatting = 'fictionWriter.formatting';


export const FictionWriter = {
	explorer: {
		revealInProjectsView: 'explorer.revealInProjectsView',
	},
	files: {
		split: `${Files}.split`,
		combine: `${Files}.combine`,
		extract: `${Files}.extract`,
		extractMultiple: `${Files}.extractMultiple`,
	},
	formatting: {
		reformat: `${Formatting}.reformat`,
		statusBar: {
			click: `${Formatting}.statusBar.click`,
		}
	},
	views: {
		projectExplorer: {
			id: `${ViewsProjectExplorer}`,
			ctx: `${ViewsProjectExplorer}.ctx`,
			vm: `${ViewsProjectExplorer}.vm`,
			open: `${ViewsProjectExplorer}.open`,
			newFile: `${ViewsProjectExplorer}.newFile`,
			newFolder: `${ViewsProjectExplorer}.newFolder`,
			rename: `${ViewsProjectExplorer}.rename`,
			trash: `${ViewsProjectExplorer}.trash`,
			addToProject: `${ViewsProjectExplorer}.addToProject`,
			excludeFromProject: `${ViewsProjectExplorer}.excludeFromProject`,
			toggleVirtualFolder: `${ViewsProjectExplorer}.toggleVirtualFolder`,
			revealInExplorer: `${ViewsProjectExplorer}.revealInExplorer`,
			view: {
				tree: `${ViewsProjectExplorer}.view.tree`,
				treeHere: `${ViewsProjectExplorer}.view.treeHere`,
				list: `${ViewsProjectExplorer}.view.list`,
				listHere: `${ViewsProjectExplorer}.view.listHere`,
			},
			filters: {
				allFiles: `${ViewsProjectExplorer}.filters.allFiles`,
				projectFiles: `${ViewsProjectExplorer}.filters.projectFiles`,
			},
			navigation: {
				back: `${ViewsProjectExplorer}.navigation.back`,
				forward: `${ViewsProjectExplorer}.navigation.forward`,
			},
			show: {
				decoration1: `${ViewsProjectExplorer}.show.decoration1`,
				decoration2: `${ViewsProjectExplorer}.show.decoration2`,
				decoration3: `${ViewsProjectExplorer}.show.decoration3`,
				decoration4: `${ViewsProjectExplorer}.show.decoration4`,
				decoration5: `${ViewsProjectExplorer}.show.decoration5`,

				extension: {
					on: `${ViewsProjectExplorer}.show.extension.on`,
					off: `${ViewsProjectExplorer}.show.extension.off`,
				},
				order: {
					on: `${ViewsProjectExplorer}.show.order.on`,
					off: `${ViewsProjectExplorer}.show.order.off`,
				}
			},
			sortBy: {
				modified: `${ViewsProjectExplorer}.sortBy.modified`,
				name: `${ViewsProjectExplorer}.sortBy.name`,
				order: `${ViewsProjectExplorer}.sortBy.order`,
			},
			sort: {
				foldersOn: `${ViewsProjectExplorer}.sort.folders.on`,
				foldersOff: `${ViewsProjectExplorer}.sort.folders.off`,
				ascOn: `${ViewsProjectExplorer}.sort.asc.on`,
				ascOff: `${ViewsProjectExplorer}.sort.asc.off`,
			},
			reorder: {
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
				childrenInclude: `${ViewsProjectExplorer}.compile.childrenInclude`,
				childrenExclude: `${ViewsProjectExplorer}.compile.childrenExclude`,
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
			setFileDescriptionMetadataKey: `${ViewsMetadata}.setFileDescriptionMetadataKey`,
			filters: {
				setFileDescriptionMetadataKey: `${ViewsMetadata}.filters.setFileDescriptionMetadataKey`
			}
		}
	},
	security: {
		exportKeys: `${Security}.exportKeys`,
	}
};

