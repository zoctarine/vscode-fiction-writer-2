import vscode, {InputBoxValidationMessage, InputBoxValidationSeverity, ThemeIcon} from 'vscode';
import {fwPath} from '../FwPath';
import path from 'path';
import {FwItemBuilder} from '../fwFiles';
import {log} from '../logging';
import {FwItem} from '../fwFiles/FwItem';


const fwItemBuilder = new FwItemBuilder();
const rootFolderPaths = vscode.workspace.workspaceFolders?.map((folder) => fwPath.asPosix(folder.uri.fsPath)) ?? [];
const getFwChanges = async (currentPath: string, nextPath: string) => {
    const ref = {
        ...fwItemBuilder.fsPathToFsRef.parse(currentPath),
        fsIsFile: true,
        fsIsFolder: false,
    };

    const info = fwItemBuilder.fsRefToFwInfo.parse(ref, {
        rootFolderPaths
    });

    const nextRef = {
        ...fwItemBuilder.fsPathToFsRef.parse(nextPath),
        fsIsFile: true,
        fsIsFolder: false,
    };
    const nextInfo = fwItemBuilder.fsRefToFwInfo.parse(nextRef, {
        rootFolderPaths
    });

    const messages = [];
    if (nextInfo.mainOrder.order.join(".") !== info.mainOrder.order.join(".")) {
        messages.push("the file order segment");
    }
    if (nextRef.fsExt !== ref.fsExt) {
        messages.push(`the file type`);
    } else if (nextInfo.extension.projectTag !== info.extension.projectTag) {
        messages.push(`the FictionWriter extended extension`);
    }

    return messages;
};

const validateFileInput = async function (value: string, basePath: string, prevPath?: string) {
    if (!fwPath.isValidName(value)) {
        return {
            message: "Value must be a valid name",
            severity: InputBoxValidationSeverity.Error
        };
    }

    const nextPath = fwPath.join(basePath, value);
    if (fwPath.exists(nextPath)) {
        return {
            message: "The file already exists",
            severity: InputBoxValidationSeverity.Error
        };
    }
    if (prevPath) {
        const messages = await getFwChanges(nextPath, prevPath);

        if (messages.length > 0) {
            let last = messages.pop();
            if (messages.length > 0) last = ` and ${last}`;
            return {
                message: `Warning: You changed ${messages.join(', ')}${last}`,
                severity: InputBoxValidationSeverity.Warning
            };
        }
    }
};

export async function fwFilenameInput(item: FwItem, opt?: Partial<{ step: number, totalSteps: number }>) {
    try {
        const startIndex = item.fsRef.fsBaseName.indexOf(item.info.name);
        let endIndex = (startIndex > 0 ? startIndex : 0) + (item.info.name.length ?? 0);

        return vscode.window.showInputBox({
            title: 'File name',
            value: item.fsRef.fsBaseName,
            valueSelection: [startIndex, endIndex],
            prompt: 'New file name',
            placeHolder: 'File name',
            validateInput: (value) => validateFileInput(value, item.fsRef.fsDir, item.fsRef.fsPath)
        });

    } catch (err) {
        log.error("Error", err);
    }
}

export class FwItemOption implements vscode.QuickPickItem {
    label: string;
    description: string;
    fsPath: string | undefined;
    detail: string | undefined;
    item: FwItem;

    constructor(item: FwItem, description?: string) {
        this.item = item;
        if (item?.fsRef?.fsPath) {
            this.label = item.fsRef.fsName;
            this.description = item.fsRef.fsExt;
            this.fsPath = item.fsRef.fsPath;
            this.detail = description;
        } else {
            this.label = '';
            this.description = '';
        }
    }
}

export async function fwItemPicker(files: FwItemOption[], opt?: Partial<{ step: number, totalSteps: number }>) {
    const disposables: vscode.Disposable[] = [];

    try {
        return await new Promise<FwItem | undefined>((resolve) => {
            const input = vscode.window.createQuickPick<FwItemOption>();
            input.items = files.filter(i => i);
            input.title = "Select filename";
            input.placeholder = 'Select file name';

            input.step = opt?.step;
            input.totalSteps = opt?.totalSteps;

            input.show();

            disposables.push(
                input.onDidHide(() => {
                    resolve(undefined);
                    input.hide();
                }),
                input.onDidChangeSelection((value) => {
                    resolve(value[0].item);
                    input.hide();
                }));
        });
    } finally {
        disposables.forEach(d => d.dispose());
    }
}