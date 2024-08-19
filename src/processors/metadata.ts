import * as yaml from 'js-yaml';
import {DumpOptions} from 'js-yaml';

type YamlKind = 'sequence' | 'scalar' | 'mapping';

class CustomTag {
    constructor(public type:any, public data:any) {
    }
}

export class Metadata {
    private readonly _meta: any = {};

    constructor(meta: string | object) {

        const tags = [ 'scalar', 'sequence', 'mapping' ].map(function (kind) {
            // first argument here is a prefix, so this type will handle anything starting with !
            return new yaml.Type('', {
                kind: kind as YamlKind,
                multi: true,
                representName: function (object:any) {
                    return object.type;
                },
                represent: function (object:any) {
                    return object.data;
                },
                instanceOf: CustomTag,
                construct: function (data, type) {
                    return new CustomTag(type, data);
                }
            });
        });

        const SCHEMA = yaml.FAILSAFE_SCHEMA;


        try {
            if (typeof meta === "string") {
                this._meta = yaml.load(meta,{
                    schema: SCHEMA,
                    json: false,
                });
            } else {
                this._meta = meta;
            }
        } catch (error) {
            this._meta = {};
        }
    }

    public serialize(opts?: DumpOptions): string {
        return yaml.dump(this._meta, opts);
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