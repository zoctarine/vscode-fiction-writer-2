import {Options} from "../../core/options/options";

export class ProjectsOptions extends Options {
    public static readonly SectionName = 'projects';

    public enabled = this.valueOf('enabled', true, true);

    public fileTypes = this.valueOf('fileTypes', ['md']);
    public trackingTag = this.valueOf('fileAndFolderTrackingTag', '');
    public sorting = this.valueOf('sorting', 'order');
    public rootFoldersEnabled = this.valueOf('rootFoldersEnabled', true, true);
    public fileDescriptionMetadataKey = this.valueOf('fileDescriptionMetadataKey', 'title');
    public rootFolderNames = {
        draft: 'draft',
        trash: '.trash',
        notes: '.notes'
    };
    // sort files and folders (mixed), set explorer:sortOrder to mixed
    // sort files or folders separately, set explorer:sortOrder to foldersNestedFiles
    // max depth of virtual folders
    constructor() {
        super(ProjectsOptions.SectionName);

        this.refresh(); // Do a refresh before registering the change event,
                         // so we don't trigger the event on the initial load.
    }
}