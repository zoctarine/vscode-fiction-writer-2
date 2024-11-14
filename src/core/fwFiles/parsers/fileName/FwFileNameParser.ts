import {IFileNameParser} from './IFileNameParser';
import {IOrderParser} from '../order/IOrderParser';
import {IFwRef} from '../../IFwRef';
import path from 'path';
import fs from 'node:fs';

export class FwFileNameParser implements IFileNameParser {
    constructor(private _orderParser: IOrderParser) {
    }

    async parse(fsPath: string): Promise<IFwRef> {

        const parsed = path.posix.parse(fsPath);

        const parsedName = this._parse(parsed.base);
        const parsedOrder = this._orderParser.parse(parsedName.name);
        let exists = true;
        let isFolder = false;
        let isFile = false;
        try {
            const stat = await fs.promises.stat(fsPath);
            isFolder = stat.isDirectory();
            isFile = stat.isFile();
        } catch{
            exists = false;
        }

        return {
            order: [...parsedOrder.otherOrders ?? [], parsedOrder.mainOrder].filter(f => f !== undefined),
            orderString: parsedOrder.orderPart,
            orderedName: parsedName.name ?? '',
            name: parsedOrder.namePart ?? '',
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

    compile(parsed: IFwRef): Promise<string> {
        throw new Error('Method not implemented.');
    }

}