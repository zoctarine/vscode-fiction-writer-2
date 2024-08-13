
export class RegEx {

    public static escape(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }

    public static readonly Pattern = {
        WORDS_AND_SEPARATORS: /([\p{L}'\-]+)(?: *)([^\p{L}]*)/igu,

        WORD_OR_MULTIWORD: /^[\p{L}\-' ]+$/uig,

        WHOLE_WORD: /[\p{L}'\-]+/igu,

        ANY_CHARACTER_ESCEPT_NEWLINE: /[^\r\n]/ug,

        ANY_CHARACTER_EXCEPT_WHITESPACE: /[^\s]/ug,

        KNOWN_DIALOGUE_MARKERS: /^(\-\-{1,2} {0,1}|— {0,1})/,

        START_OF_MARKDOWN_SECTION: /^(#|\*|{---){1,}/,

        ANY_OR_NONE_LINE_INDENT: /^\s*/,

        ANY_LINE_INDENT: /^\s+/,

        TWO_OR_MORE_SPACES_IN_MIDDLE: /(?<!^\s*)\s{2,}/g,

        SENTENCE_SEPARATORS: /([\.\?\!\:\;])([\s]+)/g,

        MARKDOWN_INCLUDE_FILE:  /^\s*{(.*?)}/g,

        MARKDOWN_INCLUDE_FILE_BOUNDARIES:  /[{}]/g,

        NEWLINE: /\r?\n/g,

        METADATA_MARKER_START: /^---[ \t]*$/,

        METADATA_MARKER_END: /^(---|\.\.\.)[ \t]*$/,

        METADATA_BLOCK: /^---[ \t]*$((.|\n|\r)+?)^(---|\.\.\.)[ \t]*$(\r|\n|\r\n)?/gm,

        PARAGRAPH_BREAK: /((\n|\r\n){2,})/gu,

        ENDING_NUMBER: /\d+$/gi,

        METADATA: /^---((.*[\n\r])*)(---|\.\.\.)[\r\n]*/im
    };
}


export class FwFile {
    public static fixedGap = 10000;
    public static maxPad = 20;
    public static pad = 8;
    public static radix = 10;
    public static nameRegExp = /^([a-zA-Z0-9]+)(?:__)(.*)$/i;

    public static orderNameRegExp = /^((?:\[[a-zA-Z0-9]+\])+)(?: )(.*)$/i;
    public static orderRegExp = /\[([a-zA-Z0-9]+)\]/gi;

    public static toOrderString(order: number) {
        return `[${order.toString(FwFile.radix).toLowerCase().padStart(FwFile.pad, '0')}]`;
    }
}

