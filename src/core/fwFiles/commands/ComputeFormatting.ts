import {ICommand} from '../../lib';
import {FwFormatting, FwMarkdownFileFormat} from '../../markdown/formatting';
import {IFwInfo} from '../FwInfo';
import {FwSubType} from '../FwSubType';

export class ComputeFormatting implements ICommand<IFwInfo, FwMarkdownFileFormat | undefined> {

	run(info?: IFwInfo) {
		if (info?.subType === FwSubType.ProjectFile) {
			return FwFormatting.fromMark(info?.markers?.data);
		}

		return undefined;
	}
}