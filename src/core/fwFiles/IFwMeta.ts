import {ITextStatistics} from '../../modules/textAnalysis/textAnalyzer';

export interface IFwMeta {
    markers: {
        begin: string
        end: string
    };
    yaml?: string;
    value?: any;
}

export interface IFwContent{
    hash?: string;
    statistics?: ITextStatistics
}
