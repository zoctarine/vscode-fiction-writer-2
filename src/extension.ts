// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {richTextEditorModule} from './modules/richTextEditor';
import {projectsModule} from './modules/projectExplorer';
import {textAnalysisModule} from './modules/textAnalysis';
import {metadataModule} from './modules/metadata';
import {filtersModule} from './modules/filters';
import {securityModule} from './modules/security';
import {
    ComputeTextStatistics,
    ComputeWriteTarget, EraseMetaFromContent,
    ExtractMeta, InjectMetaIntoContent,
    SetWriteTargetDecorations,
    UpdateMeta,
    AlterState,
    ComputeContentHash,
    SetMetaDecorations, ChainedTextProcessor
} from './processors';

import {CoreModule} from './core';
import {compileModule} from './modules/compile';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const core = new CoreModule(context, {
        createTextProcessor: () => new ChainedTextProcessor()
            .add(new ExtractMeta())
            .add(new SetMetaDecorations())
            .add(new ComputeTextStatistics())
            .add(new ComputeWriteTarget())
            .add(new SetWriteTargetDecorations)
            .add(new ComputeContentHash()),
        createUpdateMetaProcessor: (updateMeta) => new ChainedTextProcessor()
            .add(new ExtractMeta())
            .add(new UpdateMeta(updateMeta))
            .add(new EraseMetaFromContent())
            .add(new InjectMetaIntoContent())
    });


    context.subscriptions.push(
        projectsModule.register(core.fileManager, core.contextManager, core.stateManager),
        textAnalysisModule.register(core.stateManager),
        metadataModule.register(context, core.contextManager, core.stateManager),
        richTextEditorModule.register(context, core.contextManager),
        filtersModule.register(core.contextManager, core.stateManager, metadataModule.metadataTreeDataProvider, metadataModule.resolvers),
        securityModule.register(),
        compileModule.register(projectsModule)
    );

    console.log(context.storageUri?.fsPath);
    // context.subscriptions.push(CodeMirrorEditorProvider.register(context));


    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Fiction Writer 2 is now active!');

    //  context.subscriptions.push(codeMirrorCommands.openInCodeMirror());
}

// This method is called when your extension is deactivated
export function deactivate() {
}
