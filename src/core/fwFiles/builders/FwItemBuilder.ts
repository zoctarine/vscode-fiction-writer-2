import {IAsyncBuilder} from '../../lib';
import {ParseFsPath} from '../commands/ParseFsPath';
import {LoadTextFile} from '../commands/LoadTextFile';
import {ExtractMeta} from '../commands/ExtractMeta';
import {FwItem} from '../FwItem';
import {ComputeHash} from '../commands/ComputeHash';
import {AnalyzeText} from '../commands/AnalyzeText';
import {BuildFwRef} from '../commands/BuildFwRef';

export class FwItemBuilder implements IAsyncBuilder<{ fsPath: string }, FwItem> {
    constructor(
        private _parsePath = new ParseFsPath(),
        private _loadText = new LoadTextFile(),
        private _extractMeta = new ExtractMeta(),
        private _computeHash = new ComputeHash(),
        private _analyzeText = new AnalyzeText(),
        private _buildFwRef = new BuildFwRef()
    ) {
    }

    public async buildAsync(input: { fsPath: string, rootFolderPaths: string[] }): Promise<FwItem> {
        const ref = await this._parsePath.runAsync(input);
        const fwRef = this._buildFwRef.run({ref, ...input});
        const text = await this._loadText.runAsync({fwRef});
        const sections = this._extractMeta.run(text);

        const item = new FwItem(
            fwRef,
            sections?.meta,
            {
                hash: this._computeHash.run(text),
                stats: this._analyzeText.run(text)
            });

        return item;
    }
}

