import {Options} from "../../core/options/options";

export class TextAnalysisOptions extends Options {
    public static readonly SectionName = 'textAnalysis';
    public enabled = this.valueOf('enabled', true, true);
    public autoRefresh = this.valueOf('autoRefreshWhenPossible', true);

    constructor() {
        super(TextAnalysisOptions.SectionName);

        this.refresh(); // Do a refresh before registering the change event,
                         // so we don't trigger the event on the initial load.
    }
}