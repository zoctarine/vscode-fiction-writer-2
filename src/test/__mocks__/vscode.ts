/**
 * Module mock for 'vscode'.
 * Add here all vscode.* members that are used by codebase under test
 *
 * @remarks
 * Only used by jest tests.
 */


const vscode = {
    Uri: {
        parse: jest.fn().mockImplementation((uri: string) => {
            return {scheme: 'file', path: uri, fsPath: uri};
        }),
    },
    EventEmitter: jest.fn(() => {
        const subscribers:((event:any)=>void)[] = [];
        return ({
            fire: (event: any) => {
                subscribers.forEach(subscriber => subscriber(event))
            },
            event: (callback: (event:any)=>void) => {
                subscribers.push(callback);
            },
            dispose: () => {
                while (subscribers.pop()){};
            }
        });
    }),
    workspace: {
        getConfiguration: jest.fn(),
        onDidChangeConfiguration: jest.fn(),
        openTextDocument: jest.fn(),
        createFileSystemWatcher: {
            onDidChange: jest.fn().mockReturnValue({dispose: () => {}}),
            onDidCreate: jest.fn().mockReturnValue({dispose: () => {}}),
            onDidDelete: jest.fn().mockReturnValue({dispose: () => {}}),
        }
    },
    window: {
        showInformationMessage: jest.fn(),
    },

};

module.exports = vscode;