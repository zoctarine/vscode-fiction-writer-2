import {DefaultOrderParser} from '../orderParsers/DefaultOrderParser';
import {FwFileNameParser} from '../nameParsing/FwFileNameParser';
import {IAsyncCommand} from '../../lib';
import {IFwRef} from '../IFwRef';

export class ParseFsPath implements IAsyncCommand<{ fsPath: string }, IFwRef> {
    constructor(private _orderParser = new DefaultOrderParser()) {
    }

    async runAsync(opt: { fsPath: string }) {
        if (!opt.fsPath) {
            throw new Error("Invalid File Path");
        }
        return await new FwFileNameParser(this._orderParser).parse(opt.fsPath);
    }
}