import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {Permissions} from '../../fwFiles';

export class SetSecurityPermissions implements IStateProcessor<IFileState> {
	async run(state: IFileState) {

		state.security = {...state.security, permissions: Permissions.get(state.fwItem?.info)};
	}
}