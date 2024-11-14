import {IProcessor, ITextProcessor} from '../IProcessor';
import {
    DefaultOrderParser,
    FwFileNameParser,
    FwItem,
    FwPermission,
    IFwFileRef, log,
    Permissions,
    RegEx
} from '../../index';
import {Metadata} from '../../metadata/metadata';

import {IFileState} from '../../state/states';
import fs from 'node:fs';
import vscode from 'vscode';
import {ChainedTextProcessor} from '../chainedTextProcessor';

export class ExtractMeta implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        const matches = content.match(RegEx.Pattern.METADATA);
        data.metadata = matches
            ? {
                markdownBlock: matches[0],
                text: matches[2],
                value: Metadata.parse(matches[2] ?? ''),
            }
            : undefined;
        return content;
    }
}

