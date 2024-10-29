import {InputFileProcessor} from './inputFileProcessor';

export * from './inputFileProcessor';
export * from '../metadata/metadata';

export {ComputeWriteTarget} from './textProcessors/computeWriteTarget';
export {SetWriteTargetDecorations} from './textProcessors/setWriteTargetDecorations';
export {ComputeTextStatistics} from './textProcessors/computeTextStatistics';
export {ChainedTextProcessor} from './chainedTextProcessor';
export {ITextProcessor} from './IProcessor';
export {IProcessor} from './IProcessor';
export {ExtractMeta} from './textProcessors/extractMeta';
export {UpdateMeta} from './textProcessors/updateMeta';
export {EraseMetaFromContent} from './eraseMetaFromContent';
export {InjectMetaIntoContent} from './textProcessors/injectMetaIntoContent';
export {AlterState} from './textProcessors/alterState';
export {ComputeContentHash} from './textProcessors/computeContentHash';
export {SetMetaDecorations} from './textProcessors/setMetaDecorations';
export {SetFwItemDecorations} from './textProcessors/setFwItemDecorations';
export {SetTextStatisticsDecorations} from './textProcessors/setTextStatisticsDecorations';
export {IDecorationState} from '../state/states';
export {IMetaState} from '../state/states';

export const processInputFile = (text: string): string => {
    return new InputFileProcessor(text).removeMeta.value;
};