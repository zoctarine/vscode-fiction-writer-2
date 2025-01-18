export interface IFwExtension {
	/**
	 * If the filename contains the projectTag, then it is returned here.
	 * If it is missing, the file does not belong to the project
	 */
	projectTag: string | undefined;
	/**
	 * Optional data, extracted from filename
	 */
	data: string[];
	glue: string
}

export class EmptyFwExtension implements IFwExtension {
	projectTag = '';
	glue = '.';
	data = [];
}