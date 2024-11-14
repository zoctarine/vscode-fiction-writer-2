import {TextAnalyzer} from '../../../modules/textAnalysis/textAnalyzer';
import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state/states';
import {FwPermission, Permissions} from '../../fwFiles';
import {log} from '../../logging';

export class RestrictPermissionsFromMeta implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {

        if (!data.security?.permissions || !data.metadata) return content;

        let {permissions} = data.security;

        if (data.metadata.value.compile === 'exclude') {
            permissions = permissions & ~FwPermission.Compile;
        }

        data.security = {...data.security};
        data.security.permissions = permissions;

        return content;
    }
}