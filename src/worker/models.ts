import {FwFile} from '../core/fwFiles/FwFile';

export class WorkerMsg {
    public static readonly start = 'started';
    public static readonly filesChanged = 'filesChanged';
    public static readonly filesReload = 'filesReload';
}

export class ClientMsg {
    public static readonly start = 'start';
    public static readonly rootFoldersChanged = 'rootFoldersChanged';
    public static readonly fileChanged = 'filesChanged';
    public static readonly stop = 'stop';
}

export interface IWorkerMessage {
    type: string;
}

export class ClientMsgStart implements IWorkerMessage {
    type = ClientMsg.start;
}

export class ClientMsgStop implements IWorkerMessage {
    type = ClientMsg.stop;
}

export class ClientMsgRootFoldersChanged implements IWorkerMessage {
    type = ClientMsg.rootFoldersChanged;
    constructor(public paths: string[]) {
    }
}

export class ClientMsgFileChanged implements IWorkerMessage {
    type = ClientMsg.fileChanged;
    constructor(public path: string, public action:string) {}
}

export class WorkerMsgFilesChanged implements IWorkerMessage {
    type = WorkerMsg.filesChanged;
    constructor(public fwFiles: FwFile[]){

    };
}

export class WorkerMsgFilesReload implements IWorkerMessage {
    type = WorkerMsg.filesReload;
    constructor(public fwFiles: FwFile[]){

    };
}

export class WorkerMsgStart implements IWorkerMessage {
    type = WorkerMsg.start;
}


