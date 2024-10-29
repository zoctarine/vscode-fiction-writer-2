import path from 'path';
import {FwFile} from './fwFile';
import {IFwFile} from './IFwFile';


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


export class FwItem {
    public order: number = 0;
    public parentOrder: number[] = [];
    public type: FwType = FwType.Unknown;
    public control: FwControl = FwControl.Unknown;
    public data: string[] = [];
    public orderBy: string = '';

    constructor(public ref: IFwFile) {
    }
}