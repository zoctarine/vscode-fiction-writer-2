import {ITextStatistics} from '../modules/textAnalysis/textAnalyzer';
import {FwFileInfo} from '../core';

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
    statistics?: ITextAnalyzerState
    writeTargets?: IWriteTargetsState
    contentHash?: string;
}