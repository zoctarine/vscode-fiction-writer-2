// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {richTextEditorModule} from './modules/richTextEditor';
import {CodeMirrorEditorProvider, commands as codeMirrorCommands} from './modules/codeMirrorEditorView';
import {HelloWorldPanel} from "./_playground/HelloWorldPanel";
import {StateManager} from './core/stateManager';
import {projectsModule} from './modules/projectExplorer';
import {textAnalysisModule} from './modules/textAnalysis';
import {metadataModule} from './modules/metadata';
import {fileManager} from './core';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const stateManager = new StateManager(context);
    // HelloWorldPanel.render(context);
    // context.subscriptions.push(stateManager);
    context.subscriptions.push(
        projectsModule.register(stateManager),
        textAnalysisModule.register(stateManager),
        metadataModule.register(stateManager, fileManager),
        richTextEditorModule.register(stateManager, fileManager, context)
    );

    context.subscriptions.push(CodeMirrorEditorProvider.register(context));





    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Fiction Writer 2 is now active!');

    context.subscriptions.push(codeMirrorCommands.openInCodeMirror());
}

// This method is called when your extension is deactivated
export function deactivate() {
}
