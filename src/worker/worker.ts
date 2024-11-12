import {parentPort} from 'worker_threads';
import {
    IWorkerMessage,
    ClientMsgRootFoldersChanged,
    ClientMsgStart,
    ClientMsg,
    ClientMsgFileChanged
} from './models';
import {FileWorkerServer} from './fileWorkerServer';

const server = new FileWorkerServer(parentPort);

parentPort?.on('message', (e: IWorkerMessage) => {
    switch (e.type) {
        case ClientMsg.start:
            return server.start(e as ClientMsgStart);
        case ClientMsg.rootFoldersChanged:
            return server.rootFoldersChanged(e as ClientMsgRootFoldersChanged);
        case ClientMsg.fileChanged:
            return server.filesChanged(e as ClientMsgFileChanged);
        case ClientMsg.stop:
            process.exit(0);
    }
});

