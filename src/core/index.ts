import vscode from 'vscode';
import {DisposeManager} from './disposable';
import {IFileState, StateManager} from './state';
import {FwPermission, Permissions, SimpleSuffixOrderParser} from './fwFiles';
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {ContextManager} from './contextManager';
import {IStateProcessorFactory} from './processors/IStateProcessorFactory';
import {ActiveDocumentMonitor} from './activeDocumentMonitor';
import {log, notifier} from './logging';
import {registerMarkdownFormatters} from './markdown';
import {addCommand} from './commandExtensions';
import {FictionWriter} from './constants';
import {retryAsync} from './lib/retry';
import {FwFileManager} from './FwFileManager';
import {FileWorkerClient} from '../worker/FileWorkerClient';

export * from './FwFileManager';
export * from './commandExtensions';
export * from './constants';
export * from './disposable';
export * from './logging';
export * as mapExtensions from './mapExtensions';
export * from './types';
export * from './regEx';
export * from './nonce';
export * from './fwFiles';
export * from './tree';
export * from './lib';

export class CoreModule extends DisposeManager {
    stateManager: StateManager;
    fileManager: FwFileManager;
    contextManager: ContextManager;
    projectsOptions = new ProjectsOptions();
    activeDocumentMonitor: ActiveDocumentMonitor;

    constructor(context: vscode.ExtensionContext,
                public fileWorkerClient: FileWorkerClient,
                public processorFactory: IStateProcessorFactory<IFileState>) {
        super();
        this.stateManager = new StateManager(this.processorFactory);
        this.fileManager = new FwFileManager(this.projectsOptions, this.fileWorkerClient);
        this.contextManager = new ContextManager(context);
        this.activeDocumentMonitor = new ActiveDocumentMonitor();

        this.fileManager.loadFiles();

        this.manageDisposable(
            this.stateManager,
            this.fileManager,
            this.projectsOptions,
            this.activeDocumentMonitor,
            registerMarkdownFormatters(),
            this.fileManager.onFilesChanged(files => {
                log.debug("filesChanged", files.length);
                return this.stateManager.reload(files, false);
            }),

            this.fileManager.onFilesReloaded(files => {
                log.debug("filesReloaded", files.length);
                return this.stateManager.reload(files);
            }),

            this.stateManager.onFilesStateChanged(e => {
                log.debug("StateFileChanged", e.files.length);
            }),


            addCommand(FictionWriter.files.split, async () => {
                const editor = vscode.window.activeTextEditor;
                const doc = editor?.document;
                if (!doc) return;
                const fwItem = this.stateManager.get(doc.uri.fsPath)?.fwItem;
                if (!fwItem) return;
                if (!Permissions.check(fwItem?.ref, FwPermission.Write)) return;
                let newName = 'new';
                if (editor?.selection) {
                    if (editor?.selection.isEmpty) {
                        const orderParser = new SimpleSuffixOrderParser();
                        const parsed = orderParser.parse(fwItem.ref.name.namePart ?? '');
                        parsed.mainOrder = parsed.mainOrder !== undefined ? parsed.mainOrder + 1 : parsed.mainOrder;
                        newName = orderParser.serialize(parsed);
                    } else {
                        newName = editor.document.getText(editor.selection);
                    }
                }

                let splitName = `${fwItem.ref.name.orderPart}${newName}${fwItem.ref.ext}`;

                const newPath = await retryAsync(async (retry) => {
                    if (retry > 0) {
                        splitName = `${fwItem.ref.name.full} ${retry}${fwItem.ref.ext}`;
                    }
                    return await this.fileManager.splitFile(fwItem.ref.fsPath,
                        editor.selection.start.line,
                        editor.selection.start.character,
                        splitName);
                });

                if (newPath) {
                    await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(newPath));

                } else {
                    notifier.warn("File cannot be split");
                }
            }),
        );
    }
}

export {RegEx} from './regEx';
export {OptionValue} from './options/optionValue';
export {FactorySwitch} from './lib/FactorySwitch';
export {FwPath} from './FwPath';