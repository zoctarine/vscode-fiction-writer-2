import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwPermission, Permissions} from '../../fwFiles';
import {CoreColors} from '../../decorations';

export class SetSecurityDecorations implements IStateProcessor<IFileState> {
	async run(state: IFileState) {
		if (!state.security?.permissions) {
			return;
		}

		if (!Permissions.has(state.security.permissions, FwPermission.Compile)) {
			state.securityDecorations = {
				...state.securityDecorations,
				description: ' ',
				color: CoreColors.inactive
			};
		}
	}
}