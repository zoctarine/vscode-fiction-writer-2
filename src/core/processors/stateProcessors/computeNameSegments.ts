import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwControl, FwItemBuilder} from '../../fwFiles';

export class ComputeNameSegments implements IStateProcessor<IFileState> {

    constructor(private _fwItemBuilder: FwItemBuilder) {
    }

    async process(state: IFileState) {
        if (!state.fwItem?.info) return;
        const {info, fsRef} = state.fwItem;

        if (info.control === FwControl.Active) {
            const {mainOrderParser, subOrderParser, fwExtensionParser} = this._fwItemBuilder.fsRefToFwInfo;

            const order = mainOrderParser.serialize({parsed: info.mainOrder, unparsed: ''});
            const name = subOrderParser.serialize({parsed: info.subOrder, unparsed: info.name});
            const ext = fwExtensionParser.serialize({parsed: info.markers, unparsed: ''}) + fsRef.fsExt;

            state.nameTokens = {
                order,
                name,
                ext
            };
        } else {
            state.nameTokens = {
                order: '',
                name: fsRef.fsBaseName,
                ext: ''
            };
        }
    }
}

