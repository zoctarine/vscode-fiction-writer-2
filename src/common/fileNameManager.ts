import * as path from "path";
export class FwFile {
    public static fixedGap = 10000;
    public static maxPad = 20;
    public static radix = 10;
    public static ext = ".fw.md";
    public static nameRegExp= /^([a-zA-Z0-9]+)(?:__)(.*)(?:\.fw)$/i;
    public static extRegExp =/(.+)\.fw\.md$/i;

    public static validFullName(fullName: string): boolean {
        return FwFile.extRegExp.test(fullName);
    }
}

export class FwFileInfo {
    public id: string = "";
    public location: string="";
    public name: string = "";
    public ext: string = FwFile.ext;
    public order: number = 0;

    public static parse(fsPath: string): FwFileInfo {
        if (!FwFile.validFullName(fsPath)) {
            throw new Error("Not a fw file: " + fsPath);
        }

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
            result.name = parsed.name.replace(/\.fw$/gi, "");
        }
        return result;
    }

    // public getCanonicalPath(zeroPadding:number=1): string {
    //     const name = `${this.order.toString(FwFile.radix).padStart(zeroPadding, "0")}__${this.name}.fw.md`;
    //     return path.posix.join(this.location, name);
    // }
}

export class FileNameManager {
    public static fwExtension = ".fw.md";

    public static reorderOrder(fileNames: string[]) {

    }

    public static getFileMeta(filePath: string): FwFileInfo{
        return new FwFileInfo();
    }
};