import {FwControl} from './FwControl';
import {FwSubType} from './FwSubType';
import {FwRef, IFwProjectRef} from './FwRef';

export enum FwPermission {
    None = 0,
    Read = 1 << 1, // 2
    Write = 1 << 2, // 4
    Move = 1 << 3, // 8
    Delete = 1 << 4, // 16
    Rename = 1 << 5, // 32
    Sort = 1 << 6, // 64
    OpenEditor = 1 << 7, // 128
    AddToProject = 1 << 8,
    RemoveFromProject = 1 << 9,
    Morph = 1 << 10,
    Compile = 1 << 11,
}

const key = (control: FwControl, subType: FwSubType) => `${control}_${subType}`;

export class Permissions {

    private static _permissions: Map<string, FwPermission> = new Map();

    private static _add(control: FwControl, subType: FwSubType, permission: FwPermission) {
        Permissions._permissions.set(key(control, subType), permission);
    }

    static {
        Permissions._add(
            FwControl.Never, FwSubType.WorkspaceFolder,
            FwPermission.None |
            FwPermission.Compile
        );

        Permissions._add(
            FwControl.Never, FwSubType.Folder,
            FwPermission.Rename |
            FwPermission.Move |
            FwPermission.Delete |
            FwPermission.Compile
        );

        Permissions._add(
            FwControl.Active, FwSubType.ProjectFile,
            FwPermission.Read |
            FwPermission.Write |
            FwPermission.Rename |
            FwPermission.Move |
            FwPermission.Delete |
            FwPermission.Sort |
            FwPermission.OpenEditor |
            FwPermission.RemoveFromProject |
            FwPermission.Morph |
            FwPermission.Compile
        );

        Permissions._add(
            FwControl.Active, FwSubType.VirtualFolder,
            FwPermission.Read |
            FwPermission.Write |
            FwPermission.Rename |
            FwPermission.Move |
            FwPermission.Delete |
            FwPermission.Sort |
            FwPermission.OpenEditor |
            FwPermission.RemoveFromProject |
            FwPermission.Morph |
            FwPermission.Compile);

        Permissions._add(
            FwControl.Active, FwSubType.EmptyVirtualFolder,
            FwPermission.Write |
            FwPermission.Sort |
            FwPermission.Compile);

        Permissions._add(
            FwControl.Possible, FwSubType.TextFile,
            FwPermission.Read |
            FwPermission.Rename |
            FwPermission.Move |
            FwPermission.Delete |
            FwPermission.OpenEditor |
            FwPermission.AddToProject |
            FwPermission.Compile
        );

        Permissions._add(
            FwControl.Never, FwSubType.OtherFile,
            FwPermission.Rename |
            FwPermission.Move |
            FwPermission.Delete |
            FwPermission.OpenEditor);
    }

    static get(item?: IFwProjectRef): FwPermission {
        if (!item) return FwPermission.None;

        return Permissions._permissions.get(key(item?.control, item?.subType))
            ?? FwPermission.None;
    }

    static has(a?: FwPermission, b?: FwPermission): boolean {
        if (!a || !b) return false;

        return (a & b) === b;
    }

    static check(item?: IFwProjectRef, permission?: FwPermission): boolean {
        if (!permission) return false;

        const allowed = Permissions.get(item);

        if (!allowed) return false;

        return Permissions.has(allowed, permission);
    }

    static serialize(permission?: FwPermission): string {
        const permissionNames = [];
        if (!permission)   { return "";}

        for (const [name, value] of Object.entries(FwPermission)) {
            if (typeof value === 'number' &&
                value !== FwPermission.None &&
                (permission & value) === value) {
                permissionNames.push(name.toLowerCase());
            }
        }
        return permissionNames.join(' ');
    }

    static getSerialized(item?: IFwProjectRef): string {
        return Permissions.serialize(Permissions.get(item));
    }
}

