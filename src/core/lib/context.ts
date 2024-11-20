export class Context {

    public static serialize(ctx: Record<string, any>): string {
        return Object.entries(ctx)
            .filter(([_, value]) => value && ['string', 'boolean', 'number'].includes(typeof value))
            .map(([key, value]) => `${key}:${encodeURIComponent(value.toString())}`)
            .join(' ');
    }

    public static deserialize<T extends object>(ctx: string): T {
        return ctx
            .split(' ')
            .reduce((acc, part) => {
                const [key, value] = part.split(':');
                if (key in acc) {
                    (acc as any)[key] = decodeURIComponent(value);
                }
                return acc;
            }, {} as T);
    }
}