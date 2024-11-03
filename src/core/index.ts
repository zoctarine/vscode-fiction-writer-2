import vscode from 'vscode';
import {DisposeManager} from './disposable';
import {IFileState, StateManager} from './state';
import {FwFileManager, FwPermission, Permissions, SimpleSuffixOrderParser} from './fwFiles';
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {ContextManager} from './contextManager';
import {IStateProcessorFactory} from './processors/IStateProcessorFactory';
import {ActiveDocumentMonitor} from './fwFiles/activeDocumentMonitor';
import {log, notifier} from './logging';
import {registerMarkdownFormatters} from './markdown';
import {addCommand} from './commandExtensions';
import {FictionWriter} from './constants';
import {retryAsync} from './lib/retry';

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

export class CoreModule extends DisposeManager {
    stateManager: StateManager;
    fileManager: FwFileManager;
    contextManager: ContextManager;
    projectsOptions = new ProjectsOptions();
    processorFactory!: IStateProcessorFactory<IFileState>;
    activeDocumentMonitor: ActiveDocumentMonitor;

    constructor(context: vscode.ExtensionContext, processorFactory: IStateProcessorFactory<IFileState>) {
        super();
        this.processorFactory = processorFactory;
        this.stateManager = new StateManager(this.processorFactory);
        this.fileManager = new FwFileManager(this.projectsOptions);
        this.contextManager = new ContextManager(context);
        this.activeDocumentMonitor = new ActiveDocumentMonitor();

        this.fileManager.loadFiles().then((files) => {
            this.stateManager.initialize(files);
            return this.stateManager.refresh();
        });

        this.manageDisposable(
            this.stateManager,
            this.fileManager,
            // this.storageManager,
            this.projectsOptions,
            this.activeDocumentMonitor,
            registerMarkdownFormatters(),
            this.fileManager.onFilesChanged(files => {
                log.debug("filesChanged", files.length);
                return this.stateManager.reload(files);
            }),
            this.fileManager.onFilesDeleted(filePaths => {
                log.debug("filesDeleted", filePaths.length);
                return this.stateManager.forget(filePaths);
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
                if (!Permissions.check(fwItem, FwPermission.Write)) return;
                let newName = 'new';
                if (editor?.selection) {
                    if (editor?.selection.isEmpty) {
                        const orderParser = new SimpleSuffixOrderParser();
                        const parsed = orderParser.process(fwItem.ref.name);
                        parsed.mainOrder = parsed.mainOrder ? parsed.mainOrder +1 : parsed.mainOrder;
                        newName = orderParser.build(parsed);
                        log.tmp(newName);

                    } else {
                        newName = editor.document.getText(editor.selection);
                    }
                }

                let splitName = `${fwItem.ref.orderString}${newName}${fwItem.ref.ext}`;

                const newPath = await retryAsync(async (retry) => {
                    if (retry > 0) {
                        splitName = `${fwItem.ref.orderString}${fwItem.ref.name} ${retry}${fwItem.ref.ext}`;
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
            })
        );
    }
}

export {RegEx} from './regEx';
export {OptionValue} from './options/optionValue';