import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {FwSubType} from '../../fwFiles/fwSubType';
import {FaIcons} from '../../decorations';
import {log} from '../../logging';

export class SetFwItemTypeDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.fwItem) return content;

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

        data.decorations = {
            ...data.decorations,
            icon: icons.get(data.fwItem.subType) ?? FaIcons.folder,
        };
        return content;
    }
}