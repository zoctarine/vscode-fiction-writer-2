import {InputFileProcessor} from './inputFileProcessor';

export *  from './inputFileProcessor';
export * from './metadata';

export const processInputFile = (text: string): string =>{
        return new InputFileProcessor(text).removeMeta.value;
};
export * from './textProcessors/computeWriteTarget';
export {SetWriteTargetDecorations} from './textProcessors/setWriteTargetDecorations';
export {ComputeTextStatistics} from './textProcessors/computeTextStatistics';
export {ChainedTextProcessor} from './chainedTextProcessor';
export {ITextProcessor} from './IProcessor';
export {IProcessor} from './IProcessor';
export {ExtractMeta} from './textProcessors/extractMeta';
export {UpdateMeta} from './textProcessors/updateMeta';
export {EraseMetaFromContent} from './eraseMetaFromContent';
export {InjectMetaIntoContent} from './textProcessors/injectMetaIntoContent';
export {IDecorationState} from './states';
export {IMetaState} from './states';