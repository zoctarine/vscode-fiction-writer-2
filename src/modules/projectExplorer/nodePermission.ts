export enum NodePermission {
    None = 0,
    Read = 1 << 1, // 2
    Write = 1 << 2, // 4
    Move = 1 << 3, // 8
    Delete = 1 << 4, // 16
    Rename = 1 << 5, // 32

    All = Read | Write | Move | Delete | Rename,
    ReadWrite = Read | Write
}


