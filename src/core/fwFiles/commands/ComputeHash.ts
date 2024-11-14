import {ICommand} from '../../lib';
import {hash} from '../../../modules/security/cryptography';

export class ComputeHash implements ICommand<string, string | undefined> {

    run(text?: string) {
        if (!text || text.length === 0) return;

        return hash(text);
    }
}