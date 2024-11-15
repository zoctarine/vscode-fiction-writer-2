import fs from 'node:fs';
import {IAsyncCommand} from '../../lib';
import {FwPermission, Permissions} from '../FwPermission';
import {FwRef} from '../FwRef';

export class LoadTextFile implements IAsyncCommand<{ fwRef?: FwRef }, string | undefined> {

    async runAsync({fwRef = undefined}: { fwRef?: FwRef }) {
        if (!fwRef) return;
        if (!fwRef.ref.fsIsFile) return;
        if (!fwRef.ref.fsExists) return;
        if (!Permissions.check(fwRef, FwPermission.Read)) return;

        try {
            return await fs.promises.readFile(fwRef.ref.fsPath, {encoding: 'utf8'});
        } catch (err) {
            return undefined;
        }
    }
}