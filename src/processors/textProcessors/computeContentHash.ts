import {ITextProcessor} from '../IProcessor';
import {IMetaState, IWriteTargetsState, ITextAnalyzerState, IFileState} from '../states';
import {FileEncryptor} from '../../modules/security/fileEncryptor';

export class ComputeContentHash implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {

        data.contentHash = content ? FileEncryptor.hash(content) : "";

        return content;
    }
}