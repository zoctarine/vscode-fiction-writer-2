export enum FwMarkdownFileFormat {
	Default,  // Default (two hard breaks)
	SingleBreakForNewParagraph, // Hard line break means new paragraph  - force paragraph       (fw.p)
	IndentFirstLine, // One hard break and indent the first line of paragraph (fw.i)
	OneSentencePerLine // One sentence per line, and two hard breaks between paragraphs (fw.s)
}

export interface IFwFormatOption {
	value: FwMarkdownFileFormat;
	name: string;
	label: string;
	description: string;
}

export const FwFormatOptions = new Map<FwMarkdownFileFormat | undefined, IFwFormatOption>([
	[FwMarkdownFileFormat.Default, {
		value: FwMarkdownFileFormat.Default,
		name: FwMarkdownFileFormat[FwMarkdownFileFormat.Default],
		label: "Default",
		description: "Default Markdown Format. One empty line between paragraphs (two hard line breaks)."
	}],
	[FwMarkdownFileFormat.SingleBreakForNewParagraph, {
		value: FwMarkdownFileFormat.SingleBreakForNewParagraph,
		name: FwMarkdownFileFormat[FwMarkdownFileFormat.SingleBreakForNewParagraph],
		label: "Hard Paragraphs",
		description: "Every line break (return) is a new paragraph (one hard line break)."
	}],
	[FwMarkdownFileFormat.IndentFirstLine, {
		value: FwMarkdownFileFormat.IndentFirstLine,
		name: FwMarkdownFileFormat[FwMarkdownFileFormat.IndentFirstLine],
		label: "Indented",
		description: "Indent first line of each paragraph. (not recognized by other markdown editor)"
	}],
	[FwMarkdownFileFormat.OneSentencePerLine, {
		value: FwMarkdownFileFormat.OneSentencePerLine,
		name: FwMarkdownFileFormat[FwMarkdownFileFormat.OneSentencePerLine],
		label: "One Sentence per line",
		description: "Every sentence on a different line. One empty line between paragraphs (two hard line breaks)."
	}]
]);

export class FwFormatting {
	private static markToFormat: Map<string, FwMarkdownFileFormat> = new Map();
	private static formatToMark: Map<FwMarkdownFileFormat, string> = new Map();
	public static defaultFormat = FwMarkdownFileFormat.Default;

	// Initialize maps
	static {
		const entries: [string, FwMarkdownFileFormat][] = [
			['d', FwMarkdownFileFormat.Default],
			['h', FwMarkdownFileFormat.SingleBreakForNewParagraph],
			['i', FwMarkdownFileFormat.IndentFirstLine],
			['s', FwMarkdownFileFormat.OneSentencePerLine],
		];

		for (const [mark, format] of entries) {
			FwFormatting.markToFormat.set(mark, format);
			FwFormatting.formatToMark.set(format, mark);
		}
	}

	// Retrieve file format from mark
	static fromMark(mark?: string | string[]): FwMarkdownFileFormat {
		// If mark is an array of marks, get the first match
		if (Array.isArray(mark)) {
			for (const m of mark) {
				const format = FwFormatting.markToFormat.get(m.toLowerCase());
				if (format) {
					return format;
				}
			}
		}
		// Handle case where `mark` is a string
		else if (mark) {
			const format = FwFormatting.markToFormat.get(mark.toLowerCase());
			if (format) {
				return format;
			}
		}

		return FwFormatting.defaultFormat;
	}

	// Retrieve mark from file format
	static toMark(format?: FwMarkdownFileFormat): string | undefined {
		return FwFormatting.formatToMark.get(format ?? FwFormatting.defaultFormat);
	}
}

