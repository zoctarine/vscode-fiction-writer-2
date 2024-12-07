import {IParser, ParseResult} from '../../../lib';

export interface IFwExtension {
    projectTag: string | undefined,
    data: string[],
    glue: string
}

export class FwExtensionParser implements IParser<string, any, ParseResult<string, IFwExtension>>{
    public parse(unparsed: string) : ParseResult<string, IFwExtension>{
        const fileNameRegex = /^(?<name>.*?)(?<projectTag>\.fw)(?<data1>\.[a-z])?(?<data2>\.[a-z])?(?<data3>\.[a-z])?$/i;
        const matches = unparsed.match(fileNameRegex);
        if (matches) {
            const groups = matches.groups as any;
            const {name, projectTag, data1, data2, data3} = groups;

            return {
                unparsed: name,
                parsed: {
                    projectTag: projectTag?.substring(1),
                    data: [data1?.substring(1), data2?.substring(1), data3?.substring(1)].filter(d =>d),
                    glue: '.'
                }
            };
        } else {
            return {
                unparsed,
                parsed: {
                    projectTag: '',
                    data: [],
                    glue: '.'
                }
            };
        }
    }

    public serialize(result: ParseResult<string, IFwExtension>): string {
        const {unparsed, parsed} = result;
        let serialized = `${unparsed ?? ''}`;
        if (parsed) {
            if (parsed.projectTag) {serialized += `${parsed.glue}${parsed.projectTag}`;}
            if (parsed.data && parsed.data.length > 0) {serialized += `${parsed.glue}${parsed.data.join(parsed.glue)}`;}
        }
        return serialized;
    }
}