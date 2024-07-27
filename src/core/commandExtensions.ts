import * as vscode from 'vscode';


export function addCommand(commandName: string, callback: (...args: any[]) => any): vscode.Disposable {
    console.log(`Adding command ${makeCommandId(commandName)}`);
    return vscode.commands.registerCommand(makeCommandId(commandName), callback);
}

export function makeCommandId(name: string) {
    return `fiction-writer.${name}`;
}


