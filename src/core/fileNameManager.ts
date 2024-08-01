
export class Regex {
    public static escape(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
}


import * as path from "path";

export class FwFile {
    public static fixedGap = 10000;
    public static maxPad = 20;
    public static pad = 5;
    public static radix = 36;
    public static nameRegExp = /^([a-zA-Z0-9]+)(?:__)(.*)$/i;

    public static  orderNameRegExp = /^((?:\[[a-zA-Z0-9]+\])+)(?: )(.*)$/i;
    public static orderRegExp = /\[([a-zA-Z0-9]+)\]/gi;
}

export class FwFileInfo {
    public id: string = "";
    public location: string = "";
    public name: string = "";
    public ext: string = "";
    public order: number = 0;
    public parentOrder: number[] = [];
    public isDir: boolean = false;

    public static parse(fsPath: string, knownExtension:string[], isDirectory?: boolean): FwFileInfo {
        const result = new FwFileInfo();
        const parsed = path.parse(fsPath);
        result.id = fsPath;
        result.location = parsed.dir;
        result.isDir = isDirectory || false;

        const groups = FwFile.orderNameRegExp.exec(parsed.name);
        if (groups) {
            const tmpOrders = groups[1].matchAll(FwFile.orderRegExp);
            if (tmpOrders){
                const orders = Array.from(tmpOrders).map(a => parseInt(a[1], FwFile.radix));
                result.order = orders[orders.length-1];
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
        let fullName = result.name+result.ext;
        // sort descending by length so we can match the longest extension first
        knownExtension.sort((a,b)=>b.length-a.length);
        for(const ext of knownExtension){
            if (fullName.endsWith(`.${ext}`)) {
                result.ext = `.${ext}`;
                result.name = fullName.substring(0, fullName.length - ext.length - 1);
                break;
            }
        }
        return result;
    }

    // public getCanonicalPath(zeroPadding:number=1): string {
    //     const name = `${this.order.toString(FwFile.radix).padStart(zeroPadding, "0")}__${this.name}.fw.md`;
    //     return path.posix.join(this.location, name);
    // }
}
