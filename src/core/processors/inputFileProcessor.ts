import vscode from 'vscode';
import {Metadata} from '../metadata/metadata';
import {ITextProcessor} from './IProcessor';
import {IFileState} from '../state';
import {RegEx} from '../regEx';

export class LoadContent implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (data.fwItem) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(data.fwItem.ref.fsPath));
            if (doc) {
                content = doc.getText();
            }
        }
        return content;
    }
}


export class InputFileProcessor {
    constructor(private text: string) {
    }

    /**
     * Duplicates all line-breaks in the input string, so the markdown parsesr sees them as paragraphs (hard-breaks).
     * @param input A string representing a markdown content string
     * @returns
     */
    get multiplyBreaks(): InputFileProcessor {
        this.text = this.text.replaceAll('\n', '\n\n');
        return this;
    }

    get removeMeta(): InputFileProcessor {
        this.metadata;
        this.text = this.text.replace(RegEx.Pattern.METADATA, '');
        return this;
    }

    get value(): string {
        return this.text;
    }

    get metadataString(): string {
        const matches = this.text.match(RegEx.Pattern.METADATA);
        return matches ? matches[2] : '';
    }

    get metadataBlock(): string {
        const matches = this.text.match(RegEx.Pattern.METADATA);
        return matches ? matches[0] : '';
    }

    get metadata(): Metadata {
        try {
            return new Metadata(this.metadataString);
        } catch (error) {
            return new Metadata('');
        }
    }
}

