import vscode from 'vscode';
import {DisposeManager} from './disposable';
import {StateManager, IFileState} from './state';
import {FwFileManager} from './fwFiles';
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {ContextManager} from './contextManager';
import {IStateProcessorFactory} from './processors/IStateProcessorFactory';

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

    constructor(context: vscode.ExtensionContext, processorFactory: IStateProcessorFactory<IFileState>) {
        super();
        this.processorFactory = processorFactory;
        this.stateManager = new StateManager(this.processorFactory);
        this.fileManager = new FwFileManager(this.projectsOptions);
        this.contextManager = new ContextManager(context);

        this.fileManager.loadFiles().then((files) => {
            this.stateManager.initialize(files);
            return this.stateManager.refresh();
        });

        this.manageDisposable(
            this.stateManager,
            this.fileManager,
            // this.storageManager,
            this.projectsOptions,

            this.fileManager.onFilesChanged(files => {
                return this.stateManager.reload(files);
            }),

            this.stateManager.onFilesStateChanged(e => {
                console.log("BATCH", e);
            })
        );
    }
}

export {RegEx} from './regEx';
export {OptionValue} from './options/optionValue';