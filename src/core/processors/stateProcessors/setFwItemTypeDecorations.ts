import {IStateProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwSubType} from '../../fwFiles';
import {FaIcons} from '../../decorations';
import {log} from '../../logging';

export class SetFwItemTypeDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState) {
        if (!state.fwItem) return;

        const icons = new Map<FwSubType,string>([
            [FwSubType.Unknown, FaIcons.folder],
            [FwSubType.Root, FaIcons.inbox],
            [FwSubType.RootFolder, FaIcons.inbox],
            [FwSubType.WorkspaceFolder, FaIcons.inbox],
            [FwSubType.Folder, FaIcons.folder],
            [FwSubType.VirtualFolder, FaIcons.fileLinesSolid],
            [FwSubType.EmptyVirtualFolder, FaIcons.fileExcel],
            [FwSubType.ProjectFile, FaIcons.fileLines],
            [FwSubType.TextFile, 'file'],
            [FwSubType.OtherFile, 'file']
        ]);

        state.decorations = {
            ...state.decorations,
            icon: icons.get(state.fwItem.subType) ?? FaIcons.folder,
        };
        return;
    }
}