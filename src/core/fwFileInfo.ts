import path from 'path';
import {FwFile} from './fwFile';


export enum FwType {
    Unknown,
    File,
    Folder,
}

export class FwFileInfo {
    public fsPath: string = "";
    public location: string = "";
    public name: string = "";
    public ext: string = "";
    public order: number = 0;
    public parentOrder: number[] = [];
    public type: FwType = FwType.Unknown;

    public static parse(fsPath: string, knownExtension: string[], isDirectory?: boolean): FwFileInfo {
        const result = new FwFileInfo();
        const parsed = path.parse(fsPath);
        result.fsPath = fsPath;
        result.location = parsed.dir;
        result.type = isDirectory ? FwType.Folder : FwType.File;
        // we do not support extensions on folders/directories
        if (result.type === FwType.Folder) {
            parsed.name = parsed.name + parsed.ext; parsed.ext = '';
        }
        const groups = FwFile.orderNameRegExp.exec(parsed.name);
        if (groups) {
            const tmpOrders = groups[1].matchAll(FwFile.orderRegExp);
            if (tmpOrders) {
                const orders = Array.from(tmpOrders).map(a => parseInt(a[1], FwFile.radix));
                result.order = orders[orders.length - 1];
                orders.splice(-1, 1);
                result.parentOrder = [...orders];
            } else {
                result.order = 0;
                result.parentOrder = [];
            }

            result.name = groups[2];

        } else {
            result.order = 0;
            result.name = parsed.name;
        }

        result.ext = parsed.ext;
        let fullName = result.name + result.ext;
        // sort descending by length so we can match the longest extension first
        knownExtension.sort((a, b) => b.length - a.length);
        for (const ext of knownExtension) {
            if (fullName.endsWith(`.${ext}`)) {
                result.ext = `.${ext}`;
                result.name = fullName.substring(0, fullName.length - ext.length - 1);
                break;
            }
        }
        return result;
    }
}