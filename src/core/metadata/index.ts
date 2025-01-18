export * from './metadata';

export enum MetaNodeType {
	None = "unknownMeta",
	Key = "metaKey",
	Value = "metaValue",
	InlineValue = "metaInlineValue",
	Object = "metaObject",
	Link = "metaFileLink",
}