import {ICommand} from '../../lib';
import {IFwMeta} from '../IFwMeta';
import {FileEncryptor} from '../../../modules/security/fileEncryptor';

export class ExtractMeta implements ICommand<string, IFwMeta | undefined> {
    public static MetadataRegex = /^(?<md>(?<begin>---[\r\n]+)(?<yml>[\s\S]*)(?<end>---|\.\.\.)(?<spaces>[\r\n]{2}))(?<text>[\s\S]*)*/im

    run(text?: string) {
        if (!text || text.length === 0) return;

        const matches = text.match(ExtractMeta.MetadataRegex);
        if (matches?.groups) {
            return {
                markers: {
                    begin: matches.groups.begin,
                    end: matches.groups.end,
                },
                yaml: matches.groups.yml,
                contentHash: FileEncryptor.hash(matches.groups.text),
            };
        }
    }
}