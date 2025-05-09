import {IFsRef} from '../../IFsRef';
import {fwPath} from '../../../FwPath';
import {IParser} from '../../../lib';
import fs from 'node:fs';


export class FsPathToFsRef implements IParser<string, IFsRef> {
	constructor() {
	}

	parse(fsPath: string, opt?: { isFile?: boolean, isFolder?: boolean }): IFsRef {
		const parsed = fwPath.parse(fsPath);
		const stat = fs.statSync(fsPath, {throwIfNoEntry: false});
		return {
			fsExt: parsed.ext,
			fsBaseName: parsed.base,
			fsName: parsed.name,
			fsDir: parsed.dir,
			fsPath: fsPath,
			fsIsFile: stat?.isFile() ?? opt?.isFile ?? false,
			fsIsFolder: stat?.isDirectory() ?? opt?.isFolder ?? false,
			fsExists: !!stat,
			fsModifiedDate: stat?.mtimeMs
		};
	}

	serialize(ref: IFsRef): string {
		return ref?.fsPath ?? '';
	}
}