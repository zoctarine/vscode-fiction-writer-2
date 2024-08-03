
export class Regex {
    public static escape(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
}


export class FwFile {
    public static fixedGap = 10000;
    public static maxPad = 20;
    public static pad = 5;
    public static radix = 36;
    public static nameRegExp = /^([a-zA-Z0-9]+)(?:__)(.*)$/i;

    public static orderNameRegExp = /^((?:\[[a-zA-Z0-9]+\])+)(?: )(.*)$/i;
    public static orderRegExp = /\[([a-zA-Z0-9]+)\]/gi;

    public static toOrderString(order: number) {
        return `[${order.toString(FwFile.radix).toLowerCase().padStart(FwFile.pad, '0')}]`;
    }
}

