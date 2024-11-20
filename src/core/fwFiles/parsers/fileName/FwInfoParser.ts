import {FactorySwitch} from '../../../lib';
import {
    FwEmpty,
    FwFolderItem,
    FwInfo,
    FwOtherFileItem,
    FwProjectFileItem,
    FwTextFileItem,
    FwWorkspaceFolderItem
} from '../../FwInfo';
import {IFsRef} from '../../IFsRef';
import {IFwInfoParser, IOrderParser} from '../index';
import {FwType} from '../../FwType';
import {fwPath} from '../../../FwPath';
import fs from 'node:fs';

export class FwInfoParser implements IFwInfoParser {
    private _fileExtensions = ['.md', '.txt'];

    constructor(private _orderParser: IOrderParser) {

    }

    async parseAsync(ref: IFsRef, opt: { rootFolderPaths: string[] }) {
        if (!ref) return new FwEmpty();
        if (!opt.rootFolderPaths) return new FwEmpty();

        const {rootFolderPaths} = opt;

        const parsed = this._parse(ref.fsBaseName);
        const orderedName = this._orderParser.parse(parsed.name);

        const isWorkspaceFolder = ref.fsIsFolder && rootFolderPaths.includes(ref.fsPath);
        const isTextFile = ref.fsIsFile && this._fileExtensions.includes(ref.fsExt);
        const isProjectFile = ref.fsIsFile && parsed.projectTag.length > 0 && isTextFile;
        const result = new FactorySwitch<FwInfo>()
            .case(isWorkspaceFolder, () => new FwWorkspaceFolderItem())
            .case(ref.fsIsFolder, () => new FwFolderItem())
            .case(isProjectFile, () => new FwProjectFileItem())
            .case(isTextFile, () => new FwTextFileItem())
            .default(() => new FwOtherFileItem())
            .create();

        result.name = orderedName.name;
        result.order = orderedName.order;
        result.data = parsed.data;

        return result;
    }

    async serializeAsync(parsed: FwInfo, opt?: {
        rootFolderPaths: string[];
        fsDir: string,
        fsExt: string
    } | undefined): Promise<IFsRef> {

        let fsName = this._orderParser.serialize(parsed);
        if (parsed.projectTag.length > 0) {
            fsName += `.${parsed.projectTag}`;
        }

        if (parsed.data.length > 0) {
            fsName += `.${parsed.data.join('.')}`;
        }

        const fsDir = opt?.fsDir ?? '';
        const fsExt = opt?.fsExt ?? '';
        const fsBaseName = `${fsName}${fsExt}`;
        const fsPath = fwPath.join(fsDir, fsBaseName);
        let fsExists = true;
        try {
            const stat = await fs.promises.stat(fsPath);
        } catch {
            fsExists = false;
        }
        return {
            fsBaseName,
            fsDir,
            fsExists,
            fsExt,
            fsIsFile: parsed.type === FwType.File,
            fsIsFolder: parsed.type === FwType.Folder,
            fsName,
            fsPath,
            fsModifiedDate: undefined,
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

}