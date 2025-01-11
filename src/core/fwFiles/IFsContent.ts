import {ITextStatistics} from '../../modules/textAnalysis/textAnalyzer';
import {IMarkdownMeta} from './IMarkdownMeta';
import {IFsRef} from './IFsRef';
import {FwMarkdownFileFormat} from '../markdown/formatting';

export class IFsContent {
    hash?: string;
    stats?: ITextStatistics;
    meta?: IMarkdownMeta;
    format?: FwMarkdownFileFormat;
}

export class FsContentEmpty implements IFsContent{

}