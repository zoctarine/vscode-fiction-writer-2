import {ICommand} from '../../lib';
import {IMarkdownMeta} from '../IMarkdownMeta';
import {Metadata} from '../../metadata';

export class ExtractMeta implements ICommand<string, { meta?: IMarkdownMeta, text?: string } | undefined> {
	public static MetadataRegex = /^(?<md>(?<begin>---[\r\n]+)(?<yml>[\s\S]*)(?<end>---|\.\.\.)(?<spaces>[\r\n]{2}))(?<text>[\s\S]*)*/im

	run(text?: string) {
		if (!text || text.length === 0) return;

		const matches = text.match(ExtractMeta.MetadataRegex);
		if (matches?.groups) {
			return {
				meta: {
					markers: {
						begin: matches.groups.begin,
						end: matches.groups.end,
					},
					yaml: matches.groups.yml,
					value: Metadata.parse(matches.groups.yml),
				},
				text: matches.groups.text
			};
		}

		return {text};
	}
}