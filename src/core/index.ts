import {DisposeManager, IDisposable} from './disposable';
import {StateManager} from './state';
import {ChainedTextProcessor, IMetaState, ITextProcessor} from '../processors';
import {FwFileManager} from './fwFileManager';
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {ContextManager} from './contextManager';
import vscode from 'vscode';
import {projectsModule} from '../modules/projectExplorer';
import {IFileState} from '../processors/states';

export * from "./commandExtensions";
export * from "./disposable";
export * from "./fwFile";
export * from "./logger";
export * from "./nonce";
export * from "./options";
export {FwFileInfo} from './fwFileInfo';
export * as mapExtensions from "./mapExtensions";
export * from "./constants";
export * from "./iconHelper";
export * from "./types";
export * from './contributedIcons';
export * from './contributedColors';

export interface IStateProcessorFactory<TState>{
    createTextProcessor:() => ITextProcessor<TState>;
    createAlterStateProcessor?:(alterState: (state: IFileState) => IFileState) => ITextProcessor<TState>;
    createUpdateMetaProcessor:(alterState: (prevMeta: any) => any) => ITextProcessor<TState>;
}

export class CoreModule extends DisposeManager {
    stateManager: StateManager;
    fileManager: FwFileManager;
    contextManager: ContextManager;
    options = new ProjectsOptions();
    processorFactory!: IStateProcessorFactory<IFileState>;

    constructor(context: vscode.ExtensionContext, processorFactory: IStateProcessorFactory<IFileState>) {
        super();
        this.processorFactory = processorFactory;
        this.stateManager = new StateManager(this.processorFactory);
        this.fileManager = new FwFileManager(this.options);
        this.contextManager = new ContextManager(context);

        this.fileManager.loadFiles().then((files) => {
            this.stateManager.initialize(files);
            return this.stateManager.refresh();
        });

        this.manageDisposable(
            this.stateManager,
            this.fileManager,
            // this.storageManager,
            this.options,

            this.fileManager.onFilesChanged(files => {
                return this.stateManager.reload(files);
            }),

            this.stateManager.onFilesStateChanged(e => {
                console.log("BATCH", e);
            })
        );
    }

}