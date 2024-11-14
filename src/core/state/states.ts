import {ITextStatistics} from '../../modules/textAnalysis/textAnalyzer';
import {FwItem, FwPermission} from '../fwFiles';

export interface IMetaState  {
    [key: string]: any;

}

export interface IDecorationState {
    icon?: string;
    highlightColor?: string;
    color?: string;
    description?: string;
    badge?:string;
}

export interface IWriteTargetsState {
    wordsTarget?: number;
    wordsTargetAchieved?: number;
    progress?: string;
}
export interface ISecurityState {
    permissions?: FwPermission;
}
export interface IFileState {
    fwItem?: FwItem,
    security?: ISecurityState,
    securityDecorations?: IDecorationState,
    decorations?: IDecorationState,
    metadata?: IMetaState,
    metadataDecorations?: IDecorationState,
    textStatisticsDecorations?: IDecorationState
    writeTargets?: IWriteTargetsState
    writeTargetsDecorations?: IDecorationState
    orderDecorations?: IDecorationState
    contentHash?: string;
}