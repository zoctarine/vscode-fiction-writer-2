// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {CoreModule, log} from './core';
import {richTextEditorModule} from './modules/richTextEditor';
import {projectsModule} from './modules/projectExplorer';
import {textAnalysisModule} from './modules/textAnalysis';
import {metadataModule} from './modules/metadata';
import {securityModule} from './modules/security';
import {compileModule} from './modules/compile';
import {formattingModule} from './modules/formatting';
import {
    ComputeTextStatistics,
    ComputeWriteTarget, EraseMetaFromContent,
    ExtractMeta, InjectMetaIntoContent,
    SetWriteTargetDecorations,
    UpdateMeta,
    AlterState,
    ComputeContentHash,
    SetMetaDecorations, ChainedTextProcessor, SetTextStatisticsDecorations, SetFwItemDecorations
} from './core/processors';


export function activate(context: vscode.ExtensionContext) {
    log.enabled = true;

    vscode.workspace.onDidOpenTextDocument(e => {
        console.log(e.languageId);
    });

    const core = new CoreModule(context, {
        createTextProcessor: () => new ChainedTextProcessor()
            .add(new ExtractMeta())
            .add(new SetMetaDecorations())
            .add(new ComputeTextStatistics())
            .add(new SetTextStatisticsDecorations())
            .add(new ComputeWriteTarget())
            .add(new SetWriteTargetDecorations)
            .add(new SetFwItemDecorations)
            .add(new ComputeContentHash()),
        createUpdateMetaProcessor: (updateMeta) => new ChainedTextProcessor()
            .add(new ExtractMeta())
            .add(new UpdateMeta(updateMeta))
            .add(new EraseMetaFromContent())
            .add(new InjectMetaIntoContent())
    });

    context.subscriptions.push(
        projectsModule.register(core),
        textAnalysisModule.register(core.stateManager),
        metadataModule.register(context, core),
        richTextEditorModule.register(context, core),
        securityModule.register(),
        compileModule.register(projectsModule),
        formattingModule.register(),
        log
    );


    log
        .text('')
        .text("FICTION WRITER is now active!")
        .text('')
        .text("Warning: this extension is in early preview. Use it ONLY for testing purposes.")
        .text('')
        .text("Watch this window for information on how your files are being processed.")
        .text("These logs might prove useful when sending error reports.")
        .text('');
}

// This method is called when your extension is deactivated
export function deactivate() {
}
