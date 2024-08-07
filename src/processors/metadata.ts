import * as yaml from 'js-yaml';

export class Metadata {
    private readonly _meta: any = {};

    constructor(meta: string | object) {
        try {
            if (typeof meta === "string") {
                this._meta = yaml.load(meta);
            } else {
                this._meta = meta;
            }
        } catch (error) {
            console.error("Invalid metadata block", error);
            this._meta = {};
        }
    }

    public serialize(): string {
        return yaml.dump(this._meta);
    }

    public get(key: string): any {
        return this._meta[key];
    }

    public set(key: string, value: any) {
        this._meta[key] = value;
    }

    get value(): any {
        return this._meta;
    }
}