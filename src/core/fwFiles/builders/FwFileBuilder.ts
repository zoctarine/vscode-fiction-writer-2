import {IAsyncBuilder} from '../../lib';
import {ParseFsPath} from '../commands/ParseFsPath';
import {LoadTextFile} from '../commands/LoadTextFile';
import {ExtractMeta} from '../commands/ExtractMeta';
import {FwFile} from '../FwFile';
import {ComputeHash} from '../commands/ComputeHash';
import {AnalyzeText} from '../commands/AnalyzeText';

export class FwFileBuilder implements IAsyncBuilder<{ fsPath: string }, FwFile> {
    constructor(
        private _parsePath = new ParseFsPath(),
        private _loadText = new LoadTextFile(),
        private _extractMeta = new ExtractMeta(),
        private _computeHash = new ComputeHash(),
        private _analyzeText = new AnalyzeText()
    ) {
    }

    public async buildAsync(input: { fsPath: string }): Promise<FwFile> {
        const ref = await this._parsePath.runAsync(input);
        const text = await this._loadText.runAsync({ref});
        const sections = this._extractMeta.run(text);

        return new FwFile(ref, sections?.meta, {
            hash: this._computeHash.run(text),
            stats: this._analyzeText.run(text)
        });
    }
}

