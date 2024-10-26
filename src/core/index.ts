import vscode from 'vscode';
import {DisposeManager} from './disposable';
import {StateManager, IFileState} from './state';
import {FwFileManager} from './fwFiles';
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {ContextManager} from './contextManager';
import {IStateProcessorFactory} from './processors/IStateProcessorFactory';
import {ActiveDocumentMonitor} from './fwFiles/activeDocumentMonitor';
import {log} from './logging';
import {registerMarkdownFormatters} from './markdown';

export * from './commandExtensions';
export * from './constants';
export * from './disposable';
export * from './logging';
export * as mapExtensions from './mapExtensions';
export * from './types';
export * from './regEx';
export * from './nonce';

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

            this.stateManager.onFilesStateChanged(e => {
               log.debug("StateFileChanged", e?.files.length);
            })
        );
    }
}

export {RegEx} from './regEx';
export {OptionValue} from './options/optionValue';