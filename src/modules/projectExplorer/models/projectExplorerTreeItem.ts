import vscode from 'vscode';
import {FictionWriter, FwControl, FwPermission, FwSubType, FwType, Permissions} from '../../../core';
import {applyDecorations, IDecorationState, IFileState} from '../../../core/state';
import {ProjectNode} from './projectNode';
import {IProjectContext} from './IProjectContext';

export interface IProjectExplorerItemOptions {
    decorationsSelector: (state: IFileState) => (IDecorationState | undefined)[];
    contextBuilder?: (state: IFileState) => Partial<IProjectContext>;
    expanded?: boolean;
}

export class ProjectExplorerTreeItem extends vscode.TreeItem {
    color?: string;

    constructor(node: ProjectNode, options: Partial<IProjectExplorerItemOptions> = {}) {
        super("ProjectExplorerTreeItem");

        let decorations = node.data?.decorations;
        if (options && options.decorationsSelector) {
            decorations = applyDecorations(decorations, ...options.decorationsSelector(node.data));
        }

        const nodeType = node.data.fwItem?.info?.subType ?? FwSubType.Unknown;
        const {data} = node;

        this.collapsibleState = data.fwItem?.info?.type === FwType.Folder
            ? options?.expanded
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

        let name = data.fwItem?.info?.name ?? '';
        if (node.data.fwItem?.info?.control !== FwControl.Active) name = data.fwItem?.fsRef?.fsName ?? '';

        this.label = {
            label: name.length > 0 ? name : 'unnamed',
            highlights: node.highlighted ? [[0, name.length]] : []
        };

        const icon = decorations?.icon ?? 'eye';
        this.description = decorations?.description;

        this.iconPath = new vscode.ThemeIcon(icon, new vscode.ThemeColor(decorations?.color ?? 'foreground'));
        this.resourceUri = vscode.Uri.parse(node.data.fwItem?.fsRef?.fsPath ?? node.id)
            .with({scheme: FictionWriter.views.projectExplorer.id});
        this.contextValue = Permissions.getSerialized(node.data.fwItem?.info);

        this.tooltip = new vscode.MarkdownString([
            `$(${icon}) **${data.fwItem?.fsRef?.fsName}**\n\n`,
            `- **Type:** ${typeToProjectType(nodeType)}`,
            `- **Order:** *${data.fwItem?.info?.order}*`,
            `- ***Full Name:*** ${data.fwItem?.fsRef?.fsBaseName}**\n\n`,
            `- ***Full Path:*** *${data.fwItem?.fsRef?.fsPath}*`,
            `- ***ViewItem:*** *${this.contextValue}*`,
            `- ***ID:*** *${node.id}*`
        ].join('\n\n'), true);

        this.command = Permissions.check(data?.fwItem?.info, FwPermission.OpenEditor)
            ? {
                title: 'Open',
                command: 'vscode.open',
                arguments: [vscode.Uri.parse(data.fwItem!.fsRef!.fsPath)]
            } : undefined;

        this.checkboxState = boolToCheckbox(node.checked);
    }
}

function boolToCheckbox(value?: boolean) {
    switch (value) {
        case true:
            return vscode.TreeItemCheckboxState.Checked;
        case false:
            return vscode.TreeItemCheckboxState.Unchecked;
        default:
            return undefined;
    }
}

const fwSubTypeToProjectTypeMap: { [key in FwSubType]?: string } = {
    [FwSubType.Root]: 'Root Folder',
    [FwSubType.RootFolder]: 'Root Folder',
    [FwSubType.ProjectFile]: 'Project File',
    [FwSubType.Folder]: 'Folder',
    [FwSubType.VirtualFolder]: 'Virtual Folder',
    [FwSubType.EmptyVirtualFolder]: 'Empty Virtual Folder',
    [FwSubType.WorkspaceFolder]: 'Workspace Folder',
    [FwSubType.Filter]: '',
    [FwSubType.FilterRoot]: '',
    [FwSubType.TextFile]: 'Text File (can be managed by FictionWriter)',
    [FwSubType.OtherFile]: 'Unknown File (**cannot** be managed by FictionWriter)',
};

function typeToProjectType(type: FwSubType): string {
    return fwSubTypeToProjectTypeMap[type] ?? '';
}


