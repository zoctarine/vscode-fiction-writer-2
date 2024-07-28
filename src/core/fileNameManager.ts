
export class Regex {
    public static escape(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
}


import * as path from "path";

export class FwFile {
    public static fixedGap = 10000;
    public static maxPad = 20;
    public static radix = 10;
    public static nameRegExp = /^([a-zA-Z0-9]+)(?:__)(.*)$/ig;
}

export class FwFileInfo {
    public id: string = "";
    public location: string = "";
    public name: string = "";
    public ext: string = "";
    public order: number = 0;

    public static parse(fsPath: string, knownExtension:string[]): FwFileInfo {
        const result = new FwFileInfo();
        const parsed = path.parse(fsPath);
        result.id = fsPath;
        result.location = parsed.dir;
        const groups = FwFile.nameRegExp.exec(parsed.name);
        if (groups) {
            result.order = parseInt(groups[1], FwFile.radix);
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
