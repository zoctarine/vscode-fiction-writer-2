import * as yaml from 'js-yaml';
import {DumpOptions} from 'js-yaml';

type YamlKind = 'sequence' | 'scalar' | 'mapping';

class CustomTag {
    constructor(public type: any, public data: any) {
    }
}

export class Metadata {
    private readonly _meta: any = {};

    constructor(meta: string | object) {

        const tags = ['scalar', 'sequence', 'mapping'].map(function (kind) {
            // first argument here is a prefix, so this type will handle anything starting with !
            return new yaml.Type('', {
                kind: kind as YamlKind,
                multi: true,
                representName: function (object: any) {
                    return object.type;
                },
                represent: function (object: any) {
                    return object.data;
                },
                instanceOf: CustomTag,
                construct: function (data, type) {
                    return new CustomTag(type, data);
                }
            });
        });

        this._meta = Metadata.parse(meta);

    }

    public serialize(opts?: DumpOptions): string {
        return yaml.dump(this._meta, opts);
    }

    public static parse(meta: string | object) {
        const SCHEMA = yaml.FAILSAFE_SCHEMA;

        try {
            if (typeof meta === "string") {
                return yaml.load(meta, {
                    schema: SCHEMA,
                    json: false,

                });
            } else {
                return meta;
            }
        } catch (error) {
            return {};
        }
    }

    public static serializeObj(obj: {}, opts?: DumpOptions): string {

        return yaml.dump(obj, {
            flowLevel: 1,
            noArrayIndent: true,
            schema: yaml.FAILSAFE_SCHEMA, ...opts
        });
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