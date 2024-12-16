import {IParserOptions, IStringParser} from '../../../lib';
import {ITokens} from '../order';
import {IFwExtension} from '../../IFwExtension';

export class FwExtensionParser implements IStringParser<ITokens<IFwExtension>>{
    public parse(input: string, opt?: IParserOptions<string, ITokens<IFwExtension>>) : ITokens<IFwExtension>{
        const fileNameRegex = /^(?<name>.*?)(?<projectTag>\.fw)(?<data1>\.[a-z])?(?<data2>\.[a-z])?(?<data3>\.[a-z])?$/i;
        const matches = input.match(fileNameRegex);

        let unparsed = input;
        let parsed = {
            projectTag: '',
            data: [] as string[],
            glue: '.'
        };

        if (matches) {
            const groups = matches.groups as any;
            const {name, projectTag, data1, data2, data3} = groups;
            unparsed = name;
            parsed = {
                projectTag: projectTag?.substring(1),
                data: [data1?.substring(1), data2?.substring(1), data3?.substring(1)].filter(d =>d),
                glue: '.',
            };
        }

        if (opt?.onParse){
            opt.onParse({parsed: parsed, unparsed});
        }

        return {
            parsed: parsed,
            unparsed
        };
    }

    public serialize({parsed, unparsed}: ITokens<IFwExtension>,
                     opt?: IParserOptions<string, ITokens<IFwExtension>> & {excludeUnparsed?:boolean}): string {
        let serialized = unparsed ?? '';
        if (opt?.excludeUnparsed === true) { serialized = '';}
        if (parsed) {
            if (parsed.projectTag) {serialized += `${parsed.glue}${parsed.projectTag}`;}
            if (parsed.data && parsed.data.length > 0) {serialized += `${parsed.glue}${parsed.data.join(parsed.glue)}`;}
        }
        return serialized;
    }
}