import {TextAnalyzer} from '../../../modules/textAnalysis/textAnalyzer';
import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state/states';
import {Permissions} from '../../fwFiles';

export class SetSecurityPermissions implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {

        data.security = {...data.security, permissions: Permissions.get(data.fwItem)};

        return content;
    }
}