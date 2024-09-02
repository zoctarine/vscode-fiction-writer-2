import {addCommand, DisposeManager, FictionWriter} from '../../core';
import vscode, {QuickPickItem} from 'vscode';
import {projectsModule, ProjectsModule} from '../projectExplorer';
import path from 'path';

class CompileModule extends DisposeManager {
    private _projectsModule!: ProjectsModule;

    constructor() {
        super();
    }

    activate(): void {
        this.manageDisposable(
            addCommand(FictionWriter.views.projectExplorer.compile.startHere, (item) => {
                this._projectsModule?.projectExplorerDataProvider?.startSelection(item);
            }),
            addCommand(FictionWriter.views.projectExplorer.compile.commit, async () => {
               const files = this._projectsModule?.projectExplorerDataProvider?.retrieveSelection();
               if (!files || !files.length) {return;}
               const contents:string[] = [];
               for (const path of files) {
                   try {
                       const rawBytes = await vscode.workspace.fs.readFile(vscode.Uri.parse(path));
                       const content = rawBytes ? new TextDecoder().decode(rawBytes) : "";
                       contents.push(content);
                   } catch (ex){
                        contents.push(`[CANNOT READ FILE ${path}]${ex}`);
                   }
               }

               console.log(contents.join('\n'));
            }),
            addCommand(FictionWriter.views.projectExplorer.compile.discard, () => {
                this._projectsModule?.projectExplorerDataProvider?.discardSelection();
            }),

        );
    };

    deactivate(): void {
        this.dispose();
    };

    register(projectModule: ProjectsModule): vscode.Disposable {
        this._projectsModule = projectsModule;
        this.activate();
        return vscode.Disposable.from(this);
    }
}

export const compileModule = new CompileModule();