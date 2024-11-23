import {IFsRefParser} from './IFwInfoParser';
import {IFsRef} from '../../IFsRef';
import {fwPath} from '../../../FwPath';
import {Path} from 'glob';


export class PathScurryToFsRef implements IFsRefParser {
    constructor() {
    }

    async parseAsync(globPath: Path): Promise<IFsRef> {
        const parsed = fwPath.parse(globPath.fullpath());
        return {
            fsExt: parsed.ext,
            fsBaseName: parsed.base,
            fsName: parsed.name,
            fsDir: parsed.dir,
            fsPath: globPath.fullpath(),
            fsIsFile: globPath.isFile(),
            fsIsFolder: globPath.isDirectory(),
            fsExists: true,
            fsModifiedDate: globPath.mtimeMs
        };
    }

    async serializeAsync(ref: IFsRef): Promise<Path> {
       throw new Error("Not implemented");
    }
}