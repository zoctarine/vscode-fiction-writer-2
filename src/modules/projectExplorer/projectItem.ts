import {FwFile} from '../../core/fwFiles';

export class ProjectItem {
    public name: string = "";
    ext: string = "";
    order: number = 0;
    description?: string;
    fsName: string = '';
    icon?: string;
    color?: string;
    checked?:boolean;

    public buildFsName(): string {
        return `${FwFile.toOrderString(this.order)} ${this.name}${this.ext}`;
    }
}