import {Options} from "../../core/options";

export class ProjectsOptions extends Options {
    public enabled = this.valueOf('enableProjects', true);
    public extension: string = "fw.md";

    public sorting = this.valueOf('sorting', 'order');
    // sort files and folders (mixed), set explorer:sortOrder to mixed
    // sort files or folders separately, set explorer:sortOrder to foldersNestedFiles
    // sort only files (do not sort folders)
    // [x] use virtual folders... add virtual path in front of document [...]
    // max depth of virtual folders
    // max depth of folders
    // use radix 10 (longer names), 36 (shorter names)
    constructor() {
        super('fictionWriter.projects');
    }
}