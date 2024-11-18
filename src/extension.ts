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
    ComputeWriteTarget,
    SetMetadata,
    SetWriteTargetDecorations,
    ChainedProcessor,
    SetTextStatisticsDecorations,
    SetSecurityPermissions,
    SetFwItemDecorations,
    SetFwItemTypeDecorations,
    SetOrderDecorations,
    SetSecurityDecorations,
    RestrictPermissionsFromMeta,
    SetMetaDecorations
} from './core/processors';


import {FileWorkerClient} from './worker/FileWorkerClient';

const fileWorkerClient = new FileWorkerClient();

export function activate(context: vscode.ExtensionContext) {
    log.enabled = true;

    const core = new CoreModule(
        context,
        fileWorkerClient,
        {
            crateStateProcessor: () => new ChainedProcessor()
                .add(new SetFwItemTypeDecorations())
                .add(new SetFwItemDecorations)

                .add(new SetMetadata())
                .add(new SetMetaDecorations())

                .add(new SetSecurityPermissions())
                .add(new RestrictPermissionsFromMeta())
                .add(new SetSecurityDecorations())

                .add(new SetTextStatisticsDecorations())

                .add(new ComputeWriteTarget())
                .add(new SetWriteTargetDecorations)

                .add(new SetOrderDecorations())
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
    fileWorkerClient.stopWorker();
}
