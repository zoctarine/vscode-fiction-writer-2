import {IAsyncBuilder} from '../../lib';
import {ParseFsPath} from '../commands/ParseFsPath';
import {LoadTextFile} from '../commands/LoadTextFile';
import {ExtractMeta} from '../commands/ExtractMeta';
import {ComputeHash} from '../commands/ComputeHash';
import {AnalyzeText} from '../commands/AnalyzeText';
import {FwItemParser} from '../parsers/FwItemParser';
import {DefaultOrderParser} from '../parsers';
import {FwItem} from '../FwItem';
import {FwPermission, Permissions} from '../FwPermission';

export class FwItemBuilder implements IAsyncBuilder<{ fsPath: string }, FwItem> {
    constructor(
        private _parsePath = new ParseFsPath(),
        private _loadText = new LoadTextFile(),
        private _extractMeta = new ExtractMeta(),
        private _computeHash = new ComputeHash(),
        private _analyzeText = new AnalyzeText(),
        private _fwItemParser = new FwItemParser(new DefaultOrderParser())
    ) {
    }

    public async buildAsync(input: { fsPath: string, rootFolderPaths: string[] }): Promise<FwItem> {
        const fwItem = new FwItem(undefined);

        fwItem.fsRef = await this._parsePath.runAsync(input);
        fwItem.info = await this._fwItemParser.parseAsync(fwItem.fsRef!, {rootFolderPaths: input.rootFolderPaths});

        const fullText = (Permissions.check(fwItem.info, FwPermission.Read))
            ? await this._loadText.runAsync({fsRef: fwItem.fsRef!})
            : undefined;

        const sections = this._extractMeta.run(fullText);
        fwItem.fsContent = {
            hash: this._computeHash.run(fullText),
            stats: this._analyzeText.run(sections?.text),
            meta: sections?.meta,
        };

        return fwItem;
    }
}

