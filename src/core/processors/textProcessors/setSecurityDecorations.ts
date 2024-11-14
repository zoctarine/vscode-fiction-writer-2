import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwPermission, Permissions} from '../../fwFiles';
import {CoreColors} from '../../decorations';

export class SetSecurityDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.security?.permissions) {
            return content;
        }

        if (!Permissions.has(data.security.permissions, FwPermission.Compile)) {
            data.securityDecorations = {
                ...data.securityDecorations,
                description: ' ',
                color: CoreColors.inactive
            };
        }

        return content;
    }
}