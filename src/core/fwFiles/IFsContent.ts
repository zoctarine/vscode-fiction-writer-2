import {ITextStatistics} from '../../modules/textAnalysis/textAnalyzer';
import {IMarkdownMeta} from './IMarkdownMeta';
import {IFsRef} from './IFsRef';

export class IFsContent {
    hash?: string;
    stats?: ITextStatistics;
    meta?: IMarkdownMeta;
}


export class IFsItem {
    ref?: IFsRef;
    content?: IFsContent;
}