import {IFwFsPathParser} from './IFileNameParser';
import {IFsRef} from '../../IFsRef';
import fs from 'node:fs';
import {fwPath} from '../../../FwPath';


export class FsPathParser implements IFwFsPathParser {
    constructor() {
    }

    async parseAsync(fsPath: string): Promise<IFsRef> {
        const parsed = fwPath.parse(fsPath);
        let exists = true;
        let isFolder = false;
        let isFile = false;
        try {
            const stat = await fs.promises.stat(fsPath);
            isFolder = stat.isDirectory();
            isFile = stat.isFile();
        } catch {
            exists = false;
        }

        return {
            fsExt: parsed.ext,
            fsBaseName: parsed.base,
            fsName: parsed.name,
            fsDir: parsed.dir,
            fsPath: fsPath,
            fsIsFile: isFile,
            fsIsFolder: isFolder,
            fsExists: exists
        };
    }

    async serializeAsync(ref: IFsRef): Promise<string> {
        return `${ref.fsPath}`;
    }
}