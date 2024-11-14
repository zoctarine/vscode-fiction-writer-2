import fs from 'node:fs';
import {log} from '../../logging';
import {IAsyncCommand} from '../../lib';
import {IFwFileRef} from '../IFwFileRef';

export class LoadTextFile implements IAsyncCommand<{ ref?: IFwFileRef }, string | undefined> {

    async runAsync({ref = undefined}: { ref?: IFwFileRef }) {
        if (!ref) return;
        if (!ref.fsIsFile) return;
        try {
            return await fs.promises.readFile(ref.fsPath, {encoding: 'utf8'});
        } catch (err) {
            log.error(`Cannot load file ${ref.fsPath}`, err);
            return undefined;
        }
    }
}