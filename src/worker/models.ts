import {FwItem} from '../core/fwFiles/FwItem';

export const WorkerMsg = {
	start: 'started',
	filesChanged: 'filesChanged',
	filesReload: 'filesReload',
	jobStarted: 'jobStarted',
	jobProgress: 'jobProgress',
	jobFinished: 'jobFinished',
	message: 'message',
} as const;

export const ClientMsg = {
	start: 'start',
	rootFoldersChanged: 'rootFoldersChanged',
	fileChanged: 'filesChanged',
	stop: 'stop',
} as const;


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

export enum FileChangeAction {
	Created = 'added',
	Deleted = 'removed',
	Modified = 'modified'
}

export class ClientMsgFileChanged implements IWorkerMessage {
	type = ClientMsg.fileChanged;

	constructor(public path: string, public action: FileChangeAction) {
	}
}

export class WorkerMsgFilesChanged implements IWorkerMessage {
	type = WorkerMsg.filesChanged;

	constructor(public fwFiles: Map<string, FwItem>) {
	};
}

export class WorkerMsgFilesReload implements IWorkerMessage {
	type = WorkerMsg.filesReload;

	constructor(public fwFiles: Map<string, FwItem>) {

	};
}

export class WorkerMsgStart implements IWorkerMessage {
	type = WorkerMsg.start;
}

export class WorkerMsgJobStarted implements IWorkerMessage {
	type = WorkerMsg.jobStarted;

	constructor(public msg: string) {
	}
}

export class WorkerMsgJobProgress implements IWorkerMessage {
	type = WorkerMsg.jobProgress;

	constructor(public msg: string, public current: number, public total: number) {
	}
}

export class WorkerMsgJobFinished implements IWorkerMessage {
	type = WorkerMsg.jobFinished;

	constructor(public msg: string) {
	}
}

export class WorkerMsgMessage implements IWorkerMessage {
	type = WorkerMsg.jobFinished;

	constructor(public msg: string, public severity: number) {
	}
}


