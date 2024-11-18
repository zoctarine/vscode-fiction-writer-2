import {IFileNameInput, IFileNameProcessor} from './IFileNameParser';
import {IOrderParser, IOrderProcessor} from '../order/IOrderParser';
import {IFwRef} from '../../IFwRef';
import path from 'path';
import fs from 'node:fs';
import {fwPath} from '../../../FwPath';
import {FwRef} from '../../FwRef';


export class FwFileNameParser implements IFileNameProcessor {
    constructor(private _orderParser: IOrderProcessor) {
    }

    build(input: IFileNameInput): IFwRef {
        const orderedName = this._orderParser.build({
            order: 1,
            otherOrders: [],
            name: input.name
        });

        let fsExt = '.md';
        let projectTag = 'fw';
        if (!input.isFile) {
            fsExt = '';
            projectTag = '';
        }

        let ext = `${projectTag}${fsExt}`;
        let fsName = `${orderedName.full}${ext}`;

        return {
            data: [],
            ext: ext,
            fsDir: input.dir,
            fsExists: false,
            fsExt: fsExt,
            fsIsFile: input.isFile,
            fsIsFolder: !input.isFile,
            fsName: fsName,
            fsPath: fwPath.join(input.dir, fsName),
            name: orderedName,
            projectTag: projectTag
        };
    }

    async parse(fsPath: string): Promise<IFwRef> {

        const parsed = path.posix.parse(fsPath);

        const parsedName = this._parse(parsed.base);

        const orderedName = this._orderParser.parse(parsedName.name);
        let exists = true;
        let isFolder = false;
        let isFile = false;
        try {
            const stat = await fs.promises.stat(fsPath);
            isFolder = stat.isDirectory();
            isFile = stat.isFile();
        } catch {
            exists = false;
        }

        return {
            name: orderedName,
            projectTag: parsedName?.projectTag,
            data: parsedName?.data ?? [],
            ext: parsedName?.ext,
            fsExt: parsed.ext,
            fsName: parsed.base,
            fsDir: parsed.dir,
            fsPath: fsPath,
            fsIsFile: isFile,
            fsIsFolder: isFolder,
            fsExists: exists
        };
    }

    private _parse(base: string) {
        const fileNameRegex = /(\.(?<projectTag>fw)?(\.(?<data1>[a-z]))?(\.(?<data2>[a-z]))?(\.(?<data3>[a-z]))?)?\.(?<ext>\w*)$/i;
        const matches = base.match(fileNameRegex);
        if (matches) {
            const groups = matches.groups as any;
            const {projectTag, data1, data2, data3, ext} = groups;

            return {
                name: base.substring(0, base.length - matches[0].length),
                ext: matches[0],
                projectTag: projectTag ?? '',
                data: [data1, data2, data3].filter(v => v)
            };
        } else {
            return {
                name: base,
                fwExt: '',
                ext: '',
                projectTag: '',
                data: []
            };
        }
    }

    async serialize(ref: IFwRef): Promise<string> {
        return ref?.fsPath;
    }
}