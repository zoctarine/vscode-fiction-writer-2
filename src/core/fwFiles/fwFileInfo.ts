import path from 'path';
import {FwFile} from './fwFile';


export enum FwType {
    Unknown = "Unknown",
    File = "File",
    Folder = "Folder",
}

export enum FwControl {
    Unknown = "Unknown",
    Active = "Active",
    Possible = "Possible",
    Never = "Never"
}


export class FwFileInfo {
    public fsPath: string = "";
    public location: string = "";
    public name: string = "";
    public ext: string = "";
    public order: number = 0;
    public parentOrder: number[] = [];
    public type: FwType = FwType.Unknown;
    public control: FwControl = FwControl.Unknown;
    public data: string[] = [];
}