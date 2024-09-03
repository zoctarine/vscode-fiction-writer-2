import {Options} from "../../core/options/options";

export class RtEditorOptions extends Options {
    public static readonly SectionName = 'editors.richTextEditor';

    public enabled = this.valueOf('enabled', true, true);
    public focusMode = this.valueOf('focusMode', 'paragraph');
    public showMergeEditor = this.valueOf('showMergeEditorOnClose', true);

    constructor() {
        super(RtEditorOptions.SectionName);

        this.refresh(); // Do a refresh before registering the change event,
                         // so we don't trigger the event on the initial load.
    }
}