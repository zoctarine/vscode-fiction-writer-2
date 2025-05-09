import {FwPermission} from '../fwFiles';
import {FwItem} from '../fwFiles/FwItem';
import {FwMarkdownFileFormat} from '../markdown/formatting';

export interface IMetaState {
	[key: string]: any;
}

export interface IDecorationState {
	icon?: string;
	highlightColor?: string;
	color?: string;
	description?: string;
	badge?: string;
}

export interface IWriteTargetsState {
	wordsTarget?: number;
	wordsTargetAchieved?: number;
	progress?: string;
}

export interface ISecurityState {
	permissions?: FwPermission;
}

export interface INameSegments {
	order: string;
	name: string;
	ext: string;
}

export interface IFileState {
	fwItem?: FwItem,
	nameTokens?: INameSegments,
	security?: ISecurityState,
	securityDecorations?: IDecorationState,
	decorations?: IDecorationState,
	metadata?: IMetaState,
	metadataDecorations?: IDecorationState,
	textStatisticsDecorations?: IDecorationState
	writeTargets?: IWriteTargetsState
	writeTargetsDecorations?: IDecorationState
	orderDecorations?: IDecorationState
	datetimeDecorations?: IDecorationState
	contentHash?: string;
}