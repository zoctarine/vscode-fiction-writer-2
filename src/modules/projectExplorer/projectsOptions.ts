import {Options} from "../../common/options";

export class ProjectsOptions extends Options {
    public enabled = this.valueOf('enableProjects', true);
    public extension: string = "fw.md";

    constructor() {
        super('fictionWriter.projects');
    }
}