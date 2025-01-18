export enum ProjectView {
	tree = 'tree',
	list = 'list'
}

export interface IProjectContext {
	is: string | undefined;
	multiselect: boolean | undefined;
	decoration: string | undefined;
	filter: string | undefined;
	syncEditor: boolean | undefined;
	showExtension: boolean | undefined;
	showOrder: boolean | undefined;
	projectView: ProjectView;
	navigationRoot: string | undefined;
}
