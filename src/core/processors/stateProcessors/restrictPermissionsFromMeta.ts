import {TextAnalyzer} from '../../../modules/textAnalysis/textAnalyzer';
import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state/states';
import {FwPermission, Permissions} from '../../fwFiles';
import {log} from '../../logging';

export class RestrictPermissionsFromMeta implements IStateProcessor<IFileState> {
	async run(state: IFileState) {

		if (!state.security?.permissions || !state.metadata) return;

		let {permissions} = state.security;

		if (state.metadata.compile === 'exclude') {
			permissions = permissions & ~FwPermission.Compile;
		}

		state.security = {...state.security};
		state.security.permissions = permissions;
	}
}