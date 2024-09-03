import {ITextStatistics} from '../../modules/textAnalysis/textAnalyzer';
import {FwFileInfo} from '../fwFiles';

export interface IMetaState {
    value: any,
    text: string,
    markdownBlock: string
}

export interface IDecorationState {
    icon?: string;
    highlightColor?: string;
    color?: string;
    description?: string;
    badge?:string;
    named?:Map<string, IDecorationState>;
}

export interface ITextAnalyzerState {
    statistics?: ITextStatistics
}

export interface IWriteTargetsState {
    wordsTarget?: number;
    wordsTargetAchieved?: number;
    progress?: string;
}


export interface IFileState {
    fileInfo?: FwFileInfo,
    metadata?: IMetaState,
    decoration?: IDecorationState,
    analysis?: ITextAnalyzerState,
    writeTargets?: IWriteTargetsState
    writeTargetsDecorations?: IDecorationState
    textStatisticsDecorations?: IDecorationState
    contentHash?: string;
}

export interface IFileStateSnapshot {
    prevState: IFileState,
    state: IFileState,
}