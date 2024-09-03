import {ITextProcessor} from '../IProcessor';
import {RegEx} from '../../index';
import {Metadata} from '../../metadata/metadata';
import {IFileState} from '../../state/states';

export class UpdateMeta implements ITextProcessor<IFileState> {
    constructor(private _transformMeta: (crtMeta: any) => any) {
    }

    async process(content: string, data: IFileState): Promise<string> {

        const newValue = this._transformMeta(data.metadata?.value ?? {});
        const newText = Metadata.serializeObj(newValue);
        data.metadata = {
            value: newValue,
            text: newText,
            markdownBlock: data.metadata?.markdownBlock
                ? data.metadata.markdownBlock = data.metadata.markdownBlock.replace(RegEx.Pattern.METADATA,
                    `$1${newText}$3`)
                : `---\n${newText}---\n\n`
        };

        return content;
    }
}