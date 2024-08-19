import {window, Tab, TabInputText, Uri, Disposable, Event,
    EventEmitter, FileDecoration, FileDecorationProvider, ThemeColor} from 'vscode';
import vscode from 'vscode';
import {MetadataTreeItem} from './metadataTreeDataProvider';
import {ColorResolver, IconResolver} from './iconsAndColors';

export class MetadataTreeDecorationProvider implements FileDecorationProvider {

    private disposables: Array<Disposable> = [];

    private readonly _onDidChangeFileDecorations: EventEmitter<Uri | Uri[]> = new EventEmitter< Uri | Uri[]>();
    readonly onDidChangeFileDecorations: Event<Uri | Uri[]> = this._onDidChangeFileDecorations.event;

    constructor(resolvers: { iconResolver: IconResolver; colorResolver: ColorResolver }) {
        this.disposables = [];
        this.disposables.push(window.registerFileDecorationProvider(this));
    }

    async file(): Promise<void>  {

     return this._onDidChangeFileDecorations.fire(vscode.Uri.parse(`fictionWriter://metadata/1`));

    }

    async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
        return MetadataTreeItem.provideFileDecoration(uri);
    }

    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}

