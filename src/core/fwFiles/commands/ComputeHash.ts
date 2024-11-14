import {ICommand} from '../../lib';
import {FileEncryptor} from '../../../modules/security/fileEncryptor';

export class ComputeHash implements ICommand<string, string | undefined> {

    run(text?: string) {
        if (!text || text.length === 0) return;

        return FileEncryptor.hash(text);
    }
}