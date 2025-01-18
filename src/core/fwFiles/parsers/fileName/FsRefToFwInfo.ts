import {FactorySwitch} from '../../../lib';
import {
	FwEmptyInfo,
	FwFolderInfo,
	FwInfo,
	FwOtherFileItem,
	FwProjectFileInfo,
	FwTextFileInfo,
	FwWorkspaceFolderInfo
} from '../../FwInfo';
import {IFsRef} from '../../IFsRef';
import {IFwInfoParser, IOrderParser} from '../index';
import {FwType} from '../../FwType';
import {fwPath} from '../../../FwPath';
import fs from 'node:fs';
import {FwControl} from '../../FwControl';
import {EmptyFwOrder} from '../../IFwOrder';
import {FwExtensionParser} from './FwExtensionParser';
import {EmptyFwExtension} from '../../IFwExtension';

export class FsRefToFwInfo implements IFwInfoParser {
	private _fileExtensions = ['.md', '.txt'];

	constructor(
		public mainOrderParser: IOrderParser,
		public subOrderParser: IOrderParser,
		public fwExtensionParser = new FwExtensionParser()) {
	}

	parse(ref: IFsRef, opt: { rootFolderPaths: string[] }) {
		if (!ref) return new FwEmptyInfo();
		if (!opt.rootFolderPaths) return new FwEmptyInfo();

		const {rootFolderPaths} = opt;
		let name = ref.fsName;

		const fwExtParsed = this.fwExtensionParser.parse(name);
		const mainOrderParsed = this.mainOrderParser.parse(fwExtParsed.unparsed);
		const subOrderParsed = this.subOrderParser.parse(mainOrderParsed.unparsed);
		name = subOrderParsed.unparsed;

		const isWorkspaceFolder = ref.fsIsFolder && rootFolderPaths.includes(ref.fsPath);
		const isTextFile = ref.fsIsFile && this._fileExtensions.includes(ref.fsExt);
		const isProjectFile = ref.fsIsFile && !!fwExtParsed.parsed.projectTag && isTextFile;
		const result = new FactorySwitch<FwInfo>()
			.case(isWorkspaceFolder, () => new FwWorkspaceFolderInfo())
			.case(ref.fsIsFolder, () => new FwFolderInfo())
			.case(isProjectFile, () => new FwProjectFileInfo())
			.case(isTextFile, () => new FwTextFileInfo())
			.default(() => new FwOtherFileItem())
			.create();

		result.ext = ref.fsExt;
		result.location = ref.fsDir;
		if (result.control === FwControl.Active) {
			result.mainOrder = mainOrderParsed.parsed;
			result.subOrder = subOrderParsed.parsed;
			result.name = name;
			result.markers = fwExtParsed.parsed;
		} else {
			result.name = ref.fsName;
			result.mainOrder = new EmptyFwOrder();
			result.subOrder = new EmptyFwOrder();
			result.markers = new EmptyFwExtension();
		}
		return result;
	}

	serialize(input: FwInfo, opt?: {
		rootFolderPaths: string[];
		fsExists?: boolean,
		fsModifiedDate?: number,
	} | undefined): IFsRef {

		let fsName = input.name;
		fsName = this.subOrderParser.serialize({
			unparsed: fsName,
			parsed: input.subOrder
		});
		fsName = this.mainOrderParser.serialize({
			unparsed: fsName,
			parsed: input.mainOrder
		});
		fsName = this.fwExtensionParser.serialize({
			unparsed: fsName,
			parsed: input.markers
		});

		const fsDir = input.location ?? '';
		const fsExt = input.ext ?? '';
		const fsBaseName = `${fsName}${fsExt}`;
		const fsPath = fwPath.join(fsDir, fsBaseName);
		const fsExists = opt?.fsExists === undefined
			? !!fs.statSync(fsPath, {throwIfNoEntry: false})
			: opt.fsExists;

		return {
			fsBaseName,
			fsDir,
			fsExists,
			fsExt,
			fsIsFile: input.type === FwType.File,
			fsIsFolder: input.type === FwType.Folder,
			fsName,
			fsPath,
			fsModifiedDate: opt?.fsModifiedDate ?? Date.now(),
		};
	}
}