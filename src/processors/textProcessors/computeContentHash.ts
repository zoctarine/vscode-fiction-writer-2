import {ITextProcessor} from '../IProcessor';
import {IMetaState, IWriteTargetsState, ITextAnalyzerState} from '../states';
import {FileEncryptor} from '../../modules/security/fileEncryptor';

export class ComputeContentHash implements ITextProcessor {
    async process(content: string, data: {
        contentHash?: string
    }): Promise<string> {

        data.contentHash = content ? FileEncryptor.hash(content) : "";

        return content;
    }
}