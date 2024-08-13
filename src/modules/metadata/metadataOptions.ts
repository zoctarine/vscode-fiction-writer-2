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
]);

export class MetadataOptions extends Options {
    public static readonly SectionName = 'metadata.view';

    public enabled = this.valueOf('enabled', true, true);
    public treeIcons = defaultIcons;

    constructor() {
        super(MetadataOptions.SectionName);

        this.refresh(); // Do a refresh before registering the change event,
        // so we don't trigger the event on the initial load.
    }
}