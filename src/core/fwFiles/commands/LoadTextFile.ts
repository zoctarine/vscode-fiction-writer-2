import fs from 'node:fs';
import {IAsyncCommand} from '../../lib';
import {IFwRef} from '../IFwRef';

export class LoadTextFile implements IAsyncCommand<{ ref?: IFwRef }, string | undefined> {

    async runAsync({ref = undefined}: { ref?: IFwRef }) {
        if (!ref) return;
        if (!ref.fsIsFile) return;
        if (!ref.fsExists) return;
        try {
            return await fs.promises.readFile(ref.fsPath, {encoding: 'utf8'});
        } catch (err) {
            return undefined;
        }
    }
}