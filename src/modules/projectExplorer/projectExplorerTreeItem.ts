import {FwSubType} from '../../core/fwFiles/fwSubType';
import vscode from 'vscode';
import {FwPermission, FwControl, FwType, Permissions, FictionWriter, log} from '../../core';
import {applyDecorations, IDecorationState, IFileState} from '../../core/state';
import {TreeNode} from '../../core/tree/treeNode';

export interface IList<T> {
    sort(): IList<T>;

    filter(): IList<T>;

    items: T[];
}

export class ProjectNodeList implements IList<ProjectNode> {
    public items: ProjectNode[] = [];

    constructor(items: ProjectNode[]) {
        this.items = items;
    }

    sort(): IList<ProjectNode> {

        this.items.sort((a, b) => (a.data.fwItem?.orderBy ?? '') > (b.data.fwItem?.orderBy ?? '') ? 1 : -1);

        return this;
    }

    filter(): IList<ProjectNode> {
        this.items = this.items.filter(e => e.visible);

        return this;
    }

}


export interface IProjectExplorerItemOptions {
    decorationsSelector: (state: IFileState) => (IDecorationState | undefined)[];
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

        const nodeType = node.data.fwItem?.subType ?? FwSubType.Unknown;
        const {data} = node;

        this.collapsibleState = data.fwItem?.type === FwType.Folder
            ? options?.expanded
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

        let name = data.fwItem?.ref?.orderedName ?? '';
        if (node.data.fwItem?.control !== FwControl.Active) name = data.fwItem?.ref?.fsName ?? '';

        this.label = {
            label: name.length > 0 ? name : 'unnamed',
            highlights: node.highlighted ? [[0, name.length]] : []
        };

        const icon = decorations?.icon;
        this.description = decorations?.description;

        this.iconPath = new vscode.ThemeIcon(icon ?? '', new vscode.ThemeColor(decorations?.color ?? 'foreground'));
        this.resourceUri = vscode.Uri.parse(node.data.fwItem?.ref.fsPath ?? node.id)
            .with({scheme: FictionWriter.views.projectExplorer.id});
        this.contextValue = nodeType;

        this.tooltip = new vscode.MarkdownString([
            `$(${icon}) **${data.fwItem?.ref.orderedName}** ${data.fwItem?.ref.ext}\n\n`,
            `- **Type:** ${typeToProjectType(nodeType)}`,
            `- **Order:** *${data.fwItem?.order}*`,
            `- ***Full Name:*** ${data.fwItem?.ref.fsName}`,
            `- ***Full Path:*** *${node.id}*`,
            `- ***URI:*** *${this.resourceUri}*`
        ].join('\n\n'), true);

        this.command = Permissions.check(data?.fwItem, FwPermission.OpenEditor)
            ? {
                title: 'Open',
                command: 'vscode.open',
                arguments: [vscode.Uri.parse(data.fwItem!.ref.fsPath)]
            } : undefined;
    }
}

export class ProjectNode extends TreeNode<IFileState> {

    //
    // override acceptsChild(child: Node<ProjectItem>): boolean {
    //     if (!child.isDraggable) return false;
    //     if (child === this) return false;
    //     if (child.parent === this) return false;
    //     if (this.id.startsWith(child.id)) return false;
    //     if (this.type === FwSubType.ProjectFile) return false;
    //     if (this.type === FwSubType.VirtualFolder && ![FwSubType.VirtualFolder, FwSubType.ProjectFile].includes(child.type as FwSubType)) return false;
    //     if (this.type === FwSubType.Folder && ![FwSubType.Folder, FwSubType.ProjectFile, FwSubType.VirtualFolder].includes(child.type as FwSubType)) return false;
    //
    //     return true;
    // }
    //
    // override get acceptsChildren(): boolean {
    //     return this.type === FwSubType.Folder
    //         || this.type === FwSubType.VirtualFolder
    //         || this.type === FwSubType.WorkspaceFolder;
    // }
    //
    // override get isDraggable(): boolean {
    //     return this.type === FwSubType.Folder
    //         || this.type === FwSubType.ProjectFile
    //         || this.type === FwSubType.VirtualFolder;
    // }
    //
    // public buildFsPath(pad: number = FwFile.pad): string {
    //     const segments: string[] = [];
    //     segments.push(this.item.buildFsName());
    //
    //     let cursor = this?.parent;
    //     while (cursor && cursor?.type !== FwSubType.WorkspaceFolder) {
    //         if (cursor.type === FwSubType.VirtualFolder) {
    //             const prev = segments[segments.length - 1];
    //             segments[segments.length - 1] = FwFile.toOrderString(cursor.item.order, pad) + prev;
    //         } else {
    //             if (cursor) segments.push(cursor.item.buildFsName());
    //         }
    //         cursor = cursor.parent;
    //     }
    //     if (cursor) {
    //         segments.push(cursor.id ?? "");
    //     }
    //     return path.posix.join(...segments.reverse());
    // }
    //
    // public asTreeItem(): TreeItem {
    //     let label = this.item.name;
    //
    //     return {
    //         label: <any>{
    //             label: label,
    //             highlights: this.item.highlight ? [[0, label.length]] : []
    //         },
    //         description: this.item.description ?? '',
    //         tooltip: new vscode.MarkdownString([
    //             `$(${this.item?.icon}) **${this.item.name}** ${this.item?.ext}\n\n`,
    //             `- **Type:** ${typeToProjectType(this.type)}`,
    //             `- **Order:** *${this.item?.order}*`,
    //             `- ***Full Name:*** ${this.item?.fsName}`,
    //             `- ***Full Path:*** *${this.id}*`
    //         ].join('\n\n'), true),
    //         iconPath: new ThemeIcon(this.item.icon ?? 'file', new ThemeColor(this.item.color ?? 'foreground')),
    //         collapsibleState: this.canHaveChildren ? vscode.TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
    //         resourceUri: vscode.Uri.parse(this.id).with({scheme: FictionWriter.views.projectExplorer.id}),
    //         contextValue: this.type,
    //         command: this.can(FwPermission.OpenEditor) ? {
    //             title: 'Open',
    //             command: 'vscode.open',
    //             arguments: [vscode.Uri.parse(this.id)]
    //         } : undefined
    //     };
    // }
}

function typeToProjectType(type: FwSubType) {
    switch (type) {
        case FwSubType.Root:
            return 'Root Folder';
        case FwSubType.RootFolder:
            return 'Root Folder';
        case FwSubType.ProjectFile:
            return 'Project File';
        case FwSubType.Folder:
            return 'Folder';
        case FwSubType.VirtualFolder:
            return 'Virtual Folder';
        case FwSubType.WorkspaceFolder:
            return 'Workspace Folder';
        case FwSubType.Filter:
            return '';
        case FwSubType.FilterRoot:
            return '';
        case FwSubType.TextFile:
            return 'Text File (can be managed by FictionWriter)';
        case FwSubType.OtherFile:
            return 'Unknown File (**cannot** be managed by FictionWriter';
    }
}


