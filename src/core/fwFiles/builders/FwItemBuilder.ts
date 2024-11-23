import {IAsyncBuilder} from '../../lib';
import {LoadTextFile} from '../commands/LoadTextFile';
import {ExtractMeta} from '../commands/ExtractMeta';
import {ComputeHash} from '../commands/ComputeHash';
import {AnalyzeText} from '../commands/AnalyzeText';
import {DefaultOrderParser, FsRefToFwInfo, PathScurryToFsRef} from '../parsers';
import {FwItem} from '../FwItem';
import {FwPermission, Permissions} from '../FwPermission';
import {FwEmpty, FwRootItem} from '../FwInfo';
import {FsRefEmpty} from '../IFsRef';
import {FsContentEmpty} from '../IFsContent';
import {Path} from 'glob';
import {FsPathToFsRef} from '../parsers/fileName/FsPathToFsRef';

export class FwItemBuilder implements IAsyncBuilder<{ path: Path }, FwItem> {
    constructor(
        private _loadText = new LoadTextFile(),
        private _extractMeta = new ExtractMeta(),
        private _computeHash = new ComputeHash(),
        private _analyzeText = new AnalyzeText(),
        public fsPathToFsRef = new FsPathToFsRef(),
        public pathScurryToFsRef = new PathScurryToFsRef(),
        public fsRefToFwInfo = new FsRefToFwInfo(new DefaultOrderParser())
    ) {
    }

    public async buildAsync(input: { path: Path, rootFolderPaths?: string[] }): Promise<FwItem> {

        const fsPath = input.path.fullpath();
        if (fsPath.length === 0) {
            return new FwItem(new FsRefEmpty(), new FsContentEmpty(), new FwEmpty());
        }

        if (fsPath === 'root') {
            return new FwItem(new FsRefEmpty(), new FsContentEmpty(), new FwRootItem());
        }

        const fsRef = await this.pathScurryToFsRef.parseAsync(input.path);
        const info = this.fsRefToFwInfo.parse(fsRef, {rootFolderPaths: input.rootFolderPaths ?? []});

        const fullText = (Permissions.check(info, FwPermission.Read))
            ? await this._loadText.runAsync({fsRef})
            : undefined;

        console.log(info, Permissions.check(info, FwPermission.Read));

        const sections = this._extractMeta.run(fullText);
        const fsContent = {
            hash: this._computeHash.run(fullText),
            stats: this._analyzeText.run(sections?.text),
            meta: sections?.meta,
        };

        return new FwItem(fsRef, fsContent, info);
    }
}

