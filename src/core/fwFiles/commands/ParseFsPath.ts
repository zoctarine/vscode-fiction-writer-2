import {FsPathParser} from '../parsers/fileName/FwFileNameParser';
import {IAsyncCommand} from '../../lib';
import {IFsRef} from '../IFsRef';

export class ParseFsPath implements IAsyncCommand<{ fsPath: string }, IFsRef> {
    constructor() {
    }

    async runAsync(opt: { fsPath: string }) {
        if (!opt.fsPath) {
            throw new Error("Invalid File Path");
        }
        return await new FsPathParser().parseAsync(opt.fsPath);
    }
}