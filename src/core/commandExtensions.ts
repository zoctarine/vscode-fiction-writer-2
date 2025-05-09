import * as vscode from 'vscode';


export function addCommand(commandName: string, callback: (...args: any[]) => any): vscode.Disposable {
	return vscode.commands.registerCommand(makeCommandId(commandName), callback);
}

export function makeCommandId(name: string) {
	if (name.startsWith("fictionWriter.")) return name;
	return `fictionWriter.${name}`;
}


