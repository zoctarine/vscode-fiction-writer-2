export class InputFileProcessor {
    /**
     * Duplicates all line-breaks in the input string, so the markdown parsesr sees them as paragraphs (hard-breaks).
     * @param input A string representing a markdown content string
     * @returns 
     */
    public static multiplyBreaks(input: string): string {
        return input.replaceAll('\n', '\n\n');
    }
}