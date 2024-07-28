
export const makeLog = (prefix: string, color: string) => ({
    debug: (...args: any[]) => console.log(prefix, ...args),
    error: (...args: any[]) => console.log("ERROR " + prefix, ...args),
    warn: (...args: any[]) => console.log("WARN " + prefix, ...args),
});

export const log = makeLog("LOG", "red");

