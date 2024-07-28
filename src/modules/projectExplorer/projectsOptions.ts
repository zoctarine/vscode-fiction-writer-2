import {Options} from "../../core/options";

export class ProjectsOptions extends Options {
    public static readonly SectionName = 'projects';
    public enabled = this.valueOf('enabled', true, true);
    public filter = this.valueOf('extensionFilter', 'md');
    public sorting = this.valueOf('sorting', 'order');
    // sort files and folders (mixed), set explorer:sortOrder to mixed
    // sort files or folders separately, set explorer:sortOrder to foldersNestedFiles
    // sort only files (do not sort folders)
    // [x] use virtual folders... add virtual path in front of document [...]
    // max depth of virtual folders
    // max depth of folders
    // use radix 10 (longer names), 36 (shorter names)
    constructor() {
        super(ProjectsOptions.SectionName);

        this.refresh(); // Do a refresh before registering the change event,
                         // so we don't trigger the event on the initial load.
    }
}