import {Options} from "../../core/options";

export const defaultIcons = new Map<string, string>([
	['pov', 'eye'],
	['povs', 'eye'],
	['tag', 'tag'],
	['tags', 'tag'],
	['character', 'organization'],
	['characters', 'organization'],
	['location', 'pinned'],
	['locations', 'pinned'],
	['state', 'play-circle'],
	['status', 'pulse'],
	['draft', 'primitive-dot'],
	['title', 'code'],
	['clock', 'clock'],
	['time', 'clock'],
	['hour', 'clock'],
	['date', 'calendar'],
	['info', 'info'],
	['note', 'note'],
	['warning', 'warning'],
	['colors', 'symbol-color'],
	['color', 'symbol-color'],

	['blue', 'circle-filled'],
	['lightblue', 'circle-filled'],
	['teal', 'circle-filled'],
	['red', 'circle-filled'],
	['lightred', 'circle-filled'],
	['lime', 'circle-filled'],
	['green', 'circle-filled'],
	['orange', 'circle-filled'],
	['amber', 'circle-filled'],
	['lightamber', 'circle-filled'],
	['purple', 'circle-filled'],
	['bluegrey', 'circle-filled'],
	['grey', 'circle-filled'],
	['yellow', 'circle-filled'],
	['pink', 'circle-filled'],
	['white', 'circle-filled'],
	['black', 'circle-filled']
]);

export const defaultColors = new Map<string, string>([
	['blue', 'fictionWriter.blue'],
	['lightblue', 'fictionWriter.lightblue'],
	['teal', 'fictionWriter.teal'],
	['red', 'fictionWriter.red'],
	['lightred', 'fictionWriter.lightred'],
	['lime', 'fictionWriter.lime'],
	['green', 'fictionWriter.green'],
	['orange', 'fictionWriter.orange'],
	['amber', 'fictionWriter.amber'],
	['lightamber', 'fictionWriter.lightamber'],
	['purple', 'fictionWriter.purple'],
	['bluegrey', 'fictionWriter.bluegrey'],
	['grey', 'fictionWriter.grey'],
	['yellow', 'fictionWriter.yellow'],
	['pink', 'fictionWriter.pink'],
	['white', 'fictionWriter.white'],
	['black', 'fictionWriter.black']
]);

export class MetadataOptions extends Options {
	public static readonly SectionName = 'metadata.view';

	public enabled = this.valueOf('enabled', true, true);
	public metadataIcons = this.valueOf('icons', {});
	public metadataColors = this.valueOf('colors', {});
	public countBadgesEnabled = this.valueOf('filters.countBadges.enabled', true);

	constructor() {
		super(MetadataOptions.SectionName);

		this.refresh(); // Do a refresh before registering the change event,
		// so we don't trigger the event on the initial load.
	}
}