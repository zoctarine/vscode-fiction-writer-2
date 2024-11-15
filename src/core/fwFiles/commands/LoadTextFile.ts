import fs from 'node:fs';
import {IAsyncCommand} from '../../lib';
import {FwPermission, Permissions} from '../FwPermission';
import {FwItem} from '../FwItem';

export class LoadTextFile implements IAsyncCommand<{ item?: FwItem }, string | undefined> {

    async runAsync({item = undefined}: { item?: FwItem }) {
        if (!item) return;
        if (!item.ref.fsIsFile) return;
        if (!item.ref.fsExists) return;
        if (!Permissions.check(item, FwPermission.Read)) return;

        try {
            return await fs.promises.readFile(item.ref.fsPath, {encoding: 'utf8'});
        } catch (err) {
            return undefined;
        }
    }
}