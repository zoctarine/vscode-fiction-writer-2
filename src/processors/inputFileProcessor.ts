import {RegEx} from '../core';
import {Metadata} from './metadata';

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
        return matches ? matches[1] : '';
    }

    get metadataBlock(): string {
        const matches = this.text.match(RegEx.Pattern.METADATA);
        return matches ? matches[0] : '';
    }

    get metadata(): Metadata {
        try {
            return new Metadata(this.metadataString);
        } catch (error) {
            console.error("Invalid metadata block", error);
            return new Metadata('');
        }
    }
}

