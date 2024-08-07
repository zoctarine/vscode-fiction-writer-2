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
        this.text =  this.text.replaceAll('\n', '\n\n');
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

    get metadata(): Metadata {
        let meta = new Metadata("");
        try {
            const matches = this.text.match(RegEx.Pattern.METADATA);

            if (matches && matches.length > 1) {
                const rawMeta = matches[1];
                meta = new Metadata(rawMeta);
            }
        } catch (error) {
            console.error("Invalid metadata block", error);
        }

        return meta;
    }
}

