import {FactorySwitch, FwFilenameProcessor} from '../../../lib';
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
import {IFwInfoParser, IOrderParser, PrefixOrderParser, SuffixOrderParser} from '../index';
import {FwType} from '../../FwType';
import {fwPath} from '../../../FwPath';
import fs from 'node:fs';
import {FwControl} from '../../FwControl';
import {EmptyFwOrderedName} from '../../IFwOrderedName';
import {FwExtensionParser} from './FwExtensionParser';

export class FsRefToFwInfo implements IFwInfoParser {
    private _fileExtensions = ['.md', '.txt'];
    public filenameProcessor: FwFilenameProcessor;

    constructor(
        public mainOrderParser: IOrderParser,
        public subOrderParser: IOrderParser,
        public fwExtensionParser = new FwExtensionParser()) {

        this.filenameProcessor = new FwFilenameProcessor()
            .add(fwExtensionParser,
                (value, ctx) => {
                    ctx.fwExt = value.parsed;
                    return value.unparsed;
                },
                (value, ctx) => ({parsed: ctx.fwExt, unparsed: value})
            )
            .add(mainOrderParser,
                (value, ctx) => {
                    ctx.prefix = {order: value.order, glue: value.glue, sep: value.sep};
                    return value.name;
                },
                (value, ctx) => ({...ctx.prefix, name: value})
            )
            .add(subOrderParser,
                (value, ctx) => {
                    ctx.suffix = {order: value.order, glue: value.glue, sep: value.sep};
                    return value.name;
                },
                (value, ctx) => ({...ctx.suffix, name: value})
            );


    }

    parse(ref: IFsRef, opt: { rootFolderPaths: string[] }) {
        if (!ref) return new FwEmpty();
        if (!opt.rootFolderPaths) return new FwEmpty();

        const {rootFolderPaths} = opt;
        const ctx: any = {};
        const parsed = this.filenameProcessor.parse(ref.fsName, ctx);
        const isWorkspaceFolder = ref.fsIsFolder && rootFolderPaths.includes(ref.fsPath);
        const isTextFile = ref.fsIsFile && this._fileExtensions.includes(ref.fsExt);
        const isProjectFile = ref.fsIsFile && ctx.fwExt.projectTag.length > 0 && isTextFile;
        const result = new FactorySwitch<FwInfo>()
            .case(isWorkspaceFolder, () => new FwWorkspaceFolderItem())
            .case(ref.fsIsFolder, () => new FwFolderItem())
            .case(isProjectFile, () => new FwProjectFileItem())
            .case(isTextFile, () => new FwTextFileItem())
            .default(() => new FwOtherFileItem())
            .create();

        if (result.control === FwControl.Active) {
            result.mainOrder = ctx.prefix;
            result.subOrder = ctx.suffix;
            result.name = parsed;
            result.data = ctx.fwExt.data;
            result.displayName = ref.fsName;
            result.displayExt = this.fwExtensionParser.serialize({
                unparsed: '',
                parsed: ctx.fwExt
            }) + ref.fsExt;
        } else {
            result.name = ref.fsBaseName;
            result.displayName = ref.fsName;
            result.displayExt = ref.fsExt;
            result.mainOrder = new EmptyFwOrderedName();
            result.subOrder = new EmptyFwOrderedName();
            result.data = [];
        }

        result.orderBy = ref.fsBaseName;
        result.modified = new Date(ref.fsModifiedDate ?? 0).toLocaleDateString();
        return result;
    }

    serialize(parsed: FwInfo, opt?: {
        rootFolderPaths: string[];
        fsDir: string,
        fsExt: string
    } | undefined): IFsRef {

        const fsName = this.filenameProcessor.serialize(parsed.name, {
            prefix: parsed.mainOrder,
            suffix: parsed.subOrder,
            fwExt: {
                projectTag: parsed.projectTag,
                data: parsed.data,
                glue: '.'
            }
        });
        const fsDir = opt?.fsDir ?? '';
        const fsExt = opt?.fsExt ?? '';
        const fsBaseName = `${fsName}${fsExt}`;
        const fsPath = fwPath.join(fsDir, fsBaseName);
        const fsExists = !!fs.statSync(fsPath, {throwIfNoEntry: false});

        return {
            fsBaseName,
            fsDir,
            fsExists,
            fsExt,
            fsIsFile: parsed.type === FwType.File,
            fsIsFolder: parsed.type === FwType.Folder,
            fsName,
            fsPath,
            fsModifiedDate: Date.parse(parsed.modified),
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