import {ITextProcessor} from '../IProcessor';
import {IDecorationState, IFileState} from '../../state/states';
import {FwPermission, Permissions} from '../../fwFiles';
import {CoreColors} from '../../decorations';

export class SetOrderDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        const canSort = Permissions.check(data.fwItem, FwPermission.Sort);

        const decorations: Partial<IDecorationState> = canSort
            ? {
                description: ` `
            }
            : {
                color: CoreColors.inactive
            };

        data.orderDecorations = {
            ...data.orderDecorations,
            ...decorations
        };
        return content;
    }
}