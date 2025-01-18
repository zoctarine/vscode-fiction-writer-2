import {IAsyncBuilder} from '../../lib';
import {LoadTextFile} from '../commands/LoadTextFile';
import {ExtractMeta} from '../commands/ExtractMeta';
import {ComputeHash} from '../commands/ComputeHash';
import {AnalyzeText} from '../commands/AnalyzeText';
import {PrefixOrderParser, FsRefToFwInfo, PathScurryToFsRef, SuffixOrderParser} from '../parsers';
import {FwItem} from '../FwItem';
import {FwPermission, Permissions} from '../FwPermission';
import {FwEmptyInfo, FwRootInfo} from '../FwInfo';
import {FsRefEmpty} from '../IFsRef';
import {FsContentEmpty} from '../IFsContent';
import {Path} from 'glob';
import {FsPathToFsRef} from '../parsers/fileName/FsPathToFsRef';
import {FwItemReplicator} from '../FwItemReplicator';
import {FwFormatting, FwMarkdownFileFormat} from '../../markdown/formatting';
import {ComputeFormatting} from '../commands/ComputeFormatting';

export class FwItemBuilder implements IAsyncBuilder<{
	path: Path | string,
	isFile?: boolean,
	isFolder?: boolean
}, FwItem> {
	constructor(
		private _loadText = new LoadTextFile(),
		private _extractMeta = new ExtractMeta(),
		private _computeHash = new ComputeHash(),
		private _analyzeText = new AnalyzeText(),
		private _computeFormatting = new ComputeFormatting(),
		public fsPathToFsRef = new FsPathToFsRef(),
		public pathScurryToFsRef = new PathScurryToFsRef(),
		public fsRefToFwInfo = new FsRefToFwInfo(new PrefixOrderParser(), new SuffixOrderParser()),
	) {

	}

	public async buildAsync(input: {
		path: Path | string,
		rootFolderPaths?: string[],
		isFile?: boolean,
		isFolder?: boolean
	}): Promise<FwItem> {
		let fsPath: string;
		let path = input.path as Path;

		// TODO: build this better
		const isPathScurry = path.fullpath !== undefined;

		fsPath = isPathScurry
			? path.fullpath()
			: input.path as string;

		if (fsPath.length === 0) {
			return new FwItem(new FsRefEmpty(), new FsContentEmpty(), new FwEmptyInfo());
		}

		if (fsPath === 'root') {
			return new FwItem(new FsRefEmpty(), new FsContentEmpty(), new FwRootInfo());
		}

		const fsRef = isPathScurry
			? await this.pathScurryToFsRef.parseAsync(path)
			: this.fsPathToFsRef.parse(fsPath, input);

		const info = this.fsRefToFwInfo.parse(fsRef, {rootFolderPaths: input.rootFolderPaths ?? []});

		const fullText = (Permissions.check(info, FwPermission.Read))
			? await this._loadText.runAsync({fsRef})
			: undefined;

		const sections = this._extractMeta.run(fullText);
		const fsContent = {
			hash: this._computeHash.run(fullText),
			stats: this._analyzeText.run(sections?.text),
			meta: sections?.meta,
			format: this._computeFormatting.run(info)
		};

		return new FwItem(fsRef, fsContent, info);
	}

	public createReplicator(item: FwItem) {
		return new FwItemReplicator(item, this);
	}
}

