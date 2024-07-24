// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MetadataTreeDataProvider } from './modules/metadata/metadataTreeDataProvider';
import {ProjectExplorerTreeDataProvider} from './modules/projectExplorer/projectExplorerTreeDataProvider';
import { ProseMirrorEditorProvider, commands as proseMirrorCommands} from './modules/proseMirrorEditorView';
import { CodeMirrorEditorProvider, commands as codeMirrorCommands} from './modules/codeMirrorEditorView';
import {fileManager} from "./modules/projectExplorer/fileManager";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(fileManager); // Make sure we dispose of it

	context.subscriptions.push(ProseMirrorEditorProvider.register(context));
	context.subscriptions.push(CodeMirrorEditorProvider.register(context));
const tree = new ProjectExplorerTreeDataProvider(context);

	vscode.window.createTreeView('metadataView', {
		treeDataProvider: new MetadataTreeDataProvider()
	  });


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "fiction-writer-2" is now active!');

	context.subscriptions.push(proseMirrorCommands.openInProseMirror())	;
	context.subscriptions.push(codeMirrorCommands.openInCodeMirror())	;
}

// This method is called when your extension is deactivated
export function deactivate() {}
