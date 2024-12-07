import vscode from 'vscode';
import {DisposeManager} from './disposable';
import {IFileState, StateManager} from './state';
import {FwItemBuilder} from './fwFiles';
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {ContextManager} from './contextManager';
import {IStateProcessorFactory} from './processors/IStateProcessorFactory';
import {ActiveDocumentMonitor} from './activeDocumentMonitor';
import {log} from './logging';
import {registerMarkdownFormatters} from './markdown';
import {addCommand} from './commandExtensions';
import {FictionWriter} from './constants';
import {FwFileManager} from './FwFileManager';
import {FileWorkerClient} from '../worker/FileWorkerClient';
import {SplitActiveFile} from '../modules/projectExplorer/commands/SplitActiveFile';
import {ExtractFile} from '../modules/projectExplorer/commands/ExtractFile';
import {ExtractFiles} from '../modules/projectExplorer/commands/ExtractFiles';
import {FwItemFactory} from './FwItemFactory';

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
export * from './FwItemFactory';

export class CoreModule extends DisposeManager {
    stateManager: StateManager;
    fileManager: FwFileManager;
    contextManager: ContextManager;
    projectsOptions = new ProjectsOptions();
    activeDocumentMonitor: ActiveDocumentMonitor;
    fwItemBuilder: FwItemBuilder = new FwItemBuilder();
    fwItemFactory: FwItemFactory;

    constructor(context: vscode.ExtensionContext,
                public fileWorkerClient: FileWorkerClient,
                public processorFactory: IStateProcessorFactory<IFileState>) {
        super();
        this.stateManager = new StateManager(this.processorFactory);
        this.fileManager = new FwFileManager(this.projectsOptions, this.fileWorkerClient);
        this.fwItemFactory = new FwItemFactory(this.stateManager, this.fwItemBuilder);
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
                log.debug("fileManager: filesChanged", files.size);
                return this.stateManager.reload(files, false);
            }),

            this.fileManager.onFilesReloaded(files => {
                log.debug("fileManager: filesReloaded", files.size);
                return this.stateManager.reload(files);
            }),

            this.stateManager.onFilesStateChanged(e => {
                log.debug("stateManager: filesChanged", e.files.length);
            }),


            addCommand(FictionWriter.files.split, async () => {
               return new SplitActiveFile(
                    this.fileManager,
                    this.stateManager,
                    this.fwItemFactory
                ).runAsync(
                    vscode.window.activeTextEditor,
                );
            }),

            addCommand(FictionWriter.files.extract, async () => {
                return new ExtractFile(
                    this.fileManager,
                    this.stateManager,
                    this.fwItemBuilder
                ).runAsync(
                    vscode.window.activeTextEditor,
                );
            }),

            addCommand(FictionWriter.files.extractMultiple, async () => {
                return new ExtractFiles(
                    this.fileManager,
                    this.stateManager,
                    this.fwItemBuilder
                ).runAsync(
                    vscode.window.activeTextEditor,
                );
            }),
        );
    }
}

export {RegEx} from './regEx';
export {OptionValue} from './options/optionValue';
export {FactorySwitch} from './lib/FactorySwitch';
export {FwPath} from './FwPath';