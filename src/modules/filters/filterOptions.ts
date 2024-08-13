import {Options} from "../../core/options";

export class FilterOptions extends Options {
    public static readonly SectionName = 'metadata.filters';

    public enabled = this.valueOf('enabled', true, true);
    public countBadgesEnabled = this.valueOf('countBadges.enabled', true);

    constructor() {
        super(FilterOptions.SectionName);

        this.refresh(); // Do a refresh before registering the change event,
        // so we don't trigger the event on the initial load.
    }
}