import {IStateProcessor} from '../IProcessor';
import {applyDecorations, IFileState} from '../../state';
import {FwSubType} from '../../fwFiles';
import {MdiIcons} from '../../decorations';

export class SetFwItemTypeDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState) {
        if (!state.fwItem) return;

        const icons = new Map<FwSubType,string>([
            [FwSubType.Unknown, MdiIcons.folder],
            [FwSubType.Root, 'book'],
            [FwSubType.RootFolder, 'repo'],
            [FwSubType.WorkspaceFolder, 'repo'],
            [FwSubType.Folder, MdiIcons.folder],
            [FwSubType.VirtualFolder, MdiIcons.descriptionFill],
            [FwSubType.EmptyVirtualFolder, MdiIcons.draft],
            [FwSubType.ProjectFile, MdiIcons.description],
            [FwSubType.TextFile, 'file'],
            [FwSubType.OtherFile, 'file']
        ]);

        state.decorations = applyDecorations(
            state.decorations,
            {icon: icons.get(state.fwItem?.info?.subType!) ?? MdiIcons.folder});


        return;
    }
}