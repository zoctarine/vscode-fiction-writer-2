import { vi } from 'vitest';

/**
 * Module mock for 'vscode'.
 * Add here all vscode.* members that are used by codebase under test
 *
 * @remarks
 * Only used by jest tests.
 */


const vscode = {
	Uri: {
		parse: vi.fn().mockImplementation((uri: string) => {
			return {scheme: 'file', path: uri, fsPath: uri};
		}),
	},
	EventEmitter: vi.fn(() => {
		const subscribers: ((event: any) => void)[] = [];
		return ({
			fire: (event: any) => {
				subscribers.forEach(subscriber => subscriber(event))
			},
			event: (callback: (event: any) => void) => {
				subscribers.push(callback);
			},
			dispose: () => {
				while (subscribers.pop()) {
				}
				;
			}
		});
	}),
	workspace: {
		getConfiguration: vi.fn(),
		onDidChangeConfiguration: vi.fn(),
		openTextDocument: vi.fn(),
		createFileSystemWatcher: {
			onDidChange: vi.fn().mockReturnValue({
				dispose: () => {
				}
			}),
			onDidCreate: vi.fn().mockReturnValue({
				dispose: () => {
				}
			}),
			onDidDelete: vi.fn().mockReturnValue({
				dispose: () => {
				}
			}),
		}
	},
	window: {
		showInformationMessage: vi.fn(),
		createOutputChannel: vi.fn(),
	},

};

module.exports = vscode;