import {NodeType, RootFolderType} from './nodeType';
import {FwFile} from '../../core/fwFiles/fwFile';
import path from 'path';
import {Node, NodePermission, ProjectItem} from '../../core/tree';
import vscode, {ThemeColor, ThemeIcon, TreeItem, TreeItemCollapsibleState} from 'vscode';
import {FictionWriter, log} from '../../core';
import {FaIcons} from '../../core/decorations';

export class ProjectNode extends Node<ProjectItem> {
    constructor(id: string, item: ProjectItem) {
        super(id, item);
    }

    override acceptsChild(child: Node<ProjectItem>): boolean {
        if (!child.isDraggable) return false;
        if (child === this) return false;
        if (child.parent === this) return false;
        if (this.id.startsWith(child.id)) return false;
        if (this.type === NodeType.File) return false;
        if (this.type === NodeType.VirtualFolder && ![NodeType.VirtualFolder, NodeType.File].includes(child.type as NodeType)) return false;
        if (this.type === NodeType.Folder && ![NodeType.Folder, NodeType.File, NodeType.VirtualFolder].includes(child.type as NodeType)) return false;

        return true;
    }

    override get acceptsChildren(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.VirtualFolder
            || this.type === NodeType.WorkspaceFolder;
    }

    override get isDraggable(): boolean {
        return this.type === NodeType.Folder
            || this.type === NodeType.File
            || this.type === NodeType.VirtualFolder;
    }

    public buildFsPath(pad: number = FwFile.pad): string {
        const segments: string[] = [];
        segments.push(this.item.buildFsName());

        let cursor = this?.parent;
        while (cursor && cursor?.type !== NodeType.WorkspaceFolder) {
            if (cursor.type === NodeType.VirtualFolder) {
                const prev = segments[segments.length - 1];
                segments[segments.length - 1] = FwFile.toOrderString(cursor.item.order, pad) + prev;
            } else {
                if (cursor) segments.push(cursor.item.buildFsName());
            }
            cursor = cursor.parent;
        }
        if (cursor) {
            segments.push(cursor.id ?? "");
        }
        return path.posix.join(...segments.reverse());
    }

    public asTreeItem(): TreeItem {
        let label = this.item.name;

        return {
            label: <any>{
                label: label,
                highlights: this.item.highlight ? [[0, label.length]] : []
            },
            description: this.item.description ?? '',
            tooltip: new vscode.MarkdownString(`$(zap) ${this.id}`, true),
            iconPath: new ThemeIcon(this.item.icon ?? 'file', new ThemeColor(this.item.color ?? 'foreground')),
            collapsibleState: this.canHaveChildren ? vscode.TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
            resourceUri: vscode.Uri.parse(this.id).with({scheme: FictionWriter.views.projectExplorer.id}),
            contextValue: this.type,
            command: this.can(NodePermission.ReadWrite) ? {
                title: 'Open',
                command: 'vscode.open',
                arguments: [vscode.Uri.parse(this.id)]
            } : undefined
        };
    }
}

export class WorkspaceFolderNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.WorkspaceFolder;
        this.permissions = NodePermission.Read;

        this.item.icon = FaIcons.inbox;
        this.item.name = `[${this.item.name}]`;
        this.item.description = "";
    }
}

export class FolderNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.Folder;
        this.permissions = NodePermission.Read | NodePermission.Delete | NodePermission.Rename | NodePermission.Move;

        this.item.icon = FaIcons.folder;
    }

    asTreeItem(): TreeItem {
        return {
            ...super.asTreeItem(),
            collapsibleState: TreeItemCollapsibleState.Collapsed
        };
    }
}

export class ProjectFileNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.File;
        this.permissions = NodePermission.All;
        this.canHaveChildren = false;

        this.item.icon = FaIcons.fileLines;
    }
}

export class TextFileNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.TextFile;
        this.permissions = NodePermission.ReadWrite | NodePermission.Rename;
        this.canHaveChildren = false;

        this.item.icon = 'file';
        this.item.color = 'disabledForeground';
    }


    asTreeItem(): TreeItem {
        const label = this.item.name + this.item.ext;
        return {
            ...super.asTreeItem(),
            label: {
                label,
                highlights: this.item.highlight ? [[0, label.length]] : []
            },
            description: ''
        };
    }
}

export class OtherFileNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.OtherFile;
        this.permissions = NodePermission.ReadWrite | NodePermission.Rename;
        this.canHaveChildren = false;

        this.item.color = 'disabledForeground';
        this.item.icon = 'file';
    }

    asTreeItem(): TreeItem {
        return {
            ...super.asTreeItem(),
            label: this.item.name + this.item.ext,
            description: ''
        };
    }
}

export class VirtualFolderNode extends ProjectNode {
    constructor(id: string) {
        super(id, new ProjectItem());
        this.type = NodeType.VirtualFolder;
        this.permissions = NodePermission.All;
        this.canHaveChildren = true;
        this.item.icon = this.item.fsName
            ? FaIcons.fileLinesSolid
            : FaIcons.fileExcel;

        this.item.color = this.item.fsName
            ? 'foreground'
            : 'disabledForeground';
    }

    public static applyTo(node: ProjectNode) {
        const n = new VirtualFolderNode(node.id);
        node.type = n.type;
        node.permissions = n.permissions;
        node.canHaveChildren = n.canHaveChildren;
        if (!node.item) node.item = new ProjectItem();
        node.item.icon = n.item.icon;
        node.item.color = n.item.color;
    }
}

export class RootNode extends ProjectNode {
    constructor() {
        super('root', new ProjectItem());
        this.type = NodeType.Root;
        this.permissions = NodePermission.Read | NodePermission.Write;

        this.item.icon = "root-folder";
        this.item.name = "/";
        this.item.description = "";
    }
}

export class RootFolderNode extends ProjectNode {
    public rootFolderType: RootFolderType;

    constructor(id: string, rootFolderType: RootFolderType) {
        super(id, new ProjectItem());
        this.type = NodeType.RootFolder;
        this.rootFolderType = rootFolderType;
        this.permissions = NodePermission.Read | NodePermission.Write;
    }
}

export class TrashNode extends RootFolderNode {
    constructor() {
        super('trash', RootFolderType.Trash);
    }
}