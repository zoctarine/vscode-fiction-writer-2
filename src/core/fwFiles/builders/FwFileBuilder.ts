import {IAsyncBuilder} from '../../lib';
import {ParseFsPath} from '../commands/ParseFsPath';
import {LoadTextFile} from '../commands/LoadTextFile';
import {ExtractMeta} from '../commands/ExtractMeta';
import {FwFile} from '../FwFile';
import {ComputeHash} from '../commands/ComputeHash';
import {AnalyzeText} from '../commands/AnalyzeText';
import {FwItem} from '../FwItem';
import {BuildFwItem} from '../commands/BuildFwItem';

export class FwFileBuilder implements IAsyncBuilder<{ fsPath: string }, FwItem> {
    constructor(
        private _parsePath = new ParseFsPath(),
        private _loadText = new LoadTextFile(),
        private _extractMeta = new ExtractMeta(),
        private _computeHash = new ComputeHash(),
        private _analyzeText = new AnalyzeText(),
        private _buildFwItem = new BuildFwItem()
    ) {
    }

    public async buildAsync(input: { fsPath: string, rootFolderPaths: string[] }): Promise<FwItem> {
        const ref = await this._parsePath.runAsync(input);

        const file = new FwFile(ref);
        const item = this._buildFwItem.run({fwFile: file, ...input});
        const text = await this._loadText.runAsync({item});
        const sections = this._extractMeta.run(text);

        item.meta =  sections?.meta;
        item.content =  {
            hash: this._computeHash.run(text),
            stats: this._analyzeText.run(text)
        };

        return item;
    }
}

