
export const logger = ({
        log: (...args: any[]) => console.log(args),
        error: (...args: any[]) => console.error(args),
        warn: (...args: any[]) => console.warn(args),
    });
