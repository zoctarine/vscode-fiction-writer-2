import fs from 'node:fs';
import {IAsyncCommand} from '../../lib';
import {FwPermission, Permissions} from '../FwPermission';
import {IFsRef} from '../IFsRef';

export class LoadTextFile implements IAsyncCommand<{ fsRef?: IFsRef }, string | undefined> {

    async runAsync(input: { fsRef?: IFsRef }) {
        if (!input.fsRef) return;
        if (!input.fsRef.fsIsFile) return;
        if (!input.fsRef.fsExists) return;

        try {
            return await fs.promises.readFile(input.fsRef.fsPath, {encoding: 'utf8'});
        } catch (err) {
            return undefined;
        }
    }
}