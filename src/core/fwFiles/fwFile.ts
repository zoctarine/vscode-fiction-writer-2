


export class FwFile {
    public static fixedGap = 10000;
    public static maxPad = 20;
    public static pad = 8;
    public static radix = 10;
    public static nameRegExp = /^([a-zA-Z0-9]+)(?:__)(.*)$/i;

    public static orderNameRegExp = /^((?:\[[a-zA-Z0-9]+\])+)(?: )(.*)$/i;
    public static orderRegExp = /\[([a-zA-Z0-9]+)\]/gi;

    public static toOrderString(order: number) {
        return `[${order.toString(FwFile.radix).toLowerCase().padStart(FwFile.pad, '0')}]`;
    }
}

