import {RegEx} from '../../core/regEx';

export interface ITextStatistics {
	wordCount: number;
	charCount: number;
	charCountNoSpaces: number;
	estWordCount: number;
	estLines: number;
	estPages: number;
	estReadTimeMin: number;
	estReadTimeSec: number;
}

export class TextAnalyzer {
	static readonly STD_CHAR_PER_WORD = 6;
	static readonly STD_WORD_PER_LINE = 10;
	static readonly STD_LINES_PER_PAGE = 24;
	static readonly STD_WORDS_PER_MINUTE = 200;

	private static count = (text: string, pattern: RegExp) => {
		return ((text || '').match(pattern) || []).length;
	};

	public static analyze(rawText?: string): ITextStatistics {
		let statistics: ITextStatistics = {
			wordCount: 0,
			charCount: 0,
			charCountNoSpaces: 0,
			estWordCount: 0,
			estLines: 0,
			estPages: 0,
			estReadTimeMin: 0,
			estReadTimeSec: 0
		};

		if (!rawText) return statistics;

		const text = rawText.replace(RegEx.Pattern.METADATA_BLOCK, '');

		const wordCount = TextAnalyzer.count(text, RegEx.Pattern.WHOLE_WORD);
		const charCount = TextAnalyzer.count(text, RegEx.Pattern.ANY_CHARACTER_ESCEPT_NEWLINE);
		const charCountNoSpaces = TextAnalyzer.count(text, RegEx.Pattern.ANY_CHARACTER_EXCEPT_WHITESPACE);
		const estWordCount = Math.ceil(charCount / TextAnalyzer.STD_CHAR_PER_WORD);
		const estLines = Math.ceil(estWordCount / TextAnalyzer.STD_WORD_PER_LINE);
		const estPages = Math.ceil(estLines / TextAnalyzer.STD_LINES_PER_PAGE);
		const estReadTime = wordCount / TextAnalyzer.STD_WORDS_PER_MINUTE;
		const estReadTimeMin = Math.floor(estReadTime);
		const estReadTimeSec = Math.round(60 * (estReadTime - estReadTimeMin));

		return {
			wordCount,
			charCount,
			charCountNoSpaces,
			estWordCount,
			estLines,
			estPages,
			estReadTimeMin,
			estReadTimeSec,
		};
	}
}