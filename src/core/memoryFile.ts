import * as vscode from 'vscode';

const INMEMORY_SCHEME = "inmemoryfile";

export function registerMemoryFiles()
{
	const inMemoryProvider = new (class implements vscode.TextDocumentContentProvider
	{
		provideTextDocumentContent(uri: vscode.Uri): string
		{
			return MemFile.getDocument(uri) ?? '';
		}
	})();

	return vscode.Disposable.from(
		vscode.workspace.registerTextDocumentContentProvider(INMEMORY_SCHEME, inMemoryProvider));
}



/**
 *  Management class for in-memory files.
 **/
export  class MemFile
{
	private static _documents: Map<string, string> = new Map();

	public static getDocument(uri: vscode.Uri) : string | undefined
	{
		return MemFile._documents.get(uri.path);
	}

	public static createDocument(path: string, content: string) : vscode.Uri
	{
		let uri = vscode.Uri.from ({scheme: INMEMORY_SCHEME, path: path});
		MemFile._documents.set(uri.path, content);
		return uri;
	}
}

