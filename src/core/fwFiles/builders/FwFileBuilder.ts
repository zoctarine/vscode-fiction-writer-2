import {IAsyncBuilder} from '../../lib';
import {ParseFsPath} from '../commands/ParseFsPath';
import {LoadTextFile} from '../commands/LoadTextFile';
import {ExtractMeta} from '../commands/ExtractMeta';
import {FwFile} from '../FwFile';

export class FwFileBuilder implements IAsyncBuilder<{ fsPath: string }, FwFile> {
    constructor(private _parsePath = new ParseFsPath(),
                private _loadText = new LoadTextFile(),
                private _extractMeta = new ExtractMeta()) {
    }

    public async buildAsync(input: { fsPath: string }): Promise<FwFile> {
        const ref = await this._parsePath.runAsync(input);
        const text = await this._loadText.runAsync({ref});
        const meta = this._extractMeta.run(text);

        return new FwFile(ref, meta);
    }
}


const fileBuilder = new FwFileBuilder();
const file = await fileBuilder.buildAsync({fsPath: '..'});

