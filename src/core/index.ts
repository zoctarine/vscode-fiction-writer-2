import {DisposeManager, IDisposable} from './disposable';
import {StateManager} from './state';
import {ChainedTextProcessor, ITextProcessor} from '../processors';
import {FwFileManager} from './fwFileManager';
import {ProjectsOptions} from '../modules/projectExplorer/projectsOptions';
import {ContextManager} from './contextManager';
import vscode from 'vscode';
import {projectsModule} from '../modules/projectExplorer';

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

export class CoreModule extends DisposeManager {
    stateManager: StateManager;
    fileManager: FwFileManager;
    contextManager: ContextManager;
    options = new ProjectsOptions();
    processors = {
        textProcessors: new ChainedTextProcessor()
    };

    constructor(context: vscode.ExtensionContext) {
        super();

        this.stateManager = new StateManager(this.processors.textProcessors);
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

            this.stateManager.onFilesChanged(e => {
                console.log("BATCH", e);
            }),

            this.fileManager?.onFilesChanged(files => {
                return this.stateManager.reload(files);
            })
        );
    }

}