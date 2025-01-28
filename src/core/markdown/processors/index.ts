import {FwFormatting, FwMarkdownFileFormat} from '../formatting';
import {ITextProcessor, TextProcessor} from './TextProcessors';
import {MdIndentToStandard} from './MdIndentToStandard';
import {RemarkProcessor} from './RemarkProcessor';
import {remarkDashes} from '../plugins/remarkDashes';
import {remarkKeepAllEmptyLines} from '../plugins/remarkKeepAllEmptyLines';
import {remarkIndented} from '../plugins/remarkIndented';
import {remarkOneSentencePerLine} from '../plugins/remarkOneSentencePerLine';
import {remarkSoftBreaksRemove} from '../plugins/remarkSoftBreaksRemove';
import {remarkBreaksToParagraphs} from '../plugins/remarkBreaksToParagraphs';
import {remarkDisableCodeIndented} from '../plugins/remarkDisable';
import {remarkParagraphsAsHardBreaks} from '../plugins/remarkParagraphsAsHardBreaks';

export * from './MdIndentToStandard';
export * from './RemarkProcessor';
export * from './TextProcessors';

export interface IFormatterFactoryOptions {
	format?: FwMarkdownFileFormat;
	convertFrom?: FwMarkdownFileFormat;
}

function create(options: Partial<IFormatterFactoryOptions>): ITextProcessor {
	const formatTo = options.format || FwFormatting.defaultFormat;
	const formatFrom = options.convertFrom || formatTo;

	const fromCustomToStandard: TextProcessor = new TextProcessor();


	fromCustomToStandard.add(new RemarkProcessor(p => {
			p
				.use(remarkDashes)
				.use(remarkKeepAllEmptyLines);

			if (formatFrom === FwMarkdownFileFormat.IndentFirstLine) {
				p
					.use(remarkDisableCodeIndented)
					.use(remarkBreaksToParagraphs);
			} else if (formatFrom === FwMarkdownFileFormat.OneSentencePerLine) {
				p
					.use(remarkSoftBreaksRemove);
			} else if (formatFrom === FwMarkdownFileFormat.SingleBreakForNewParagraph) {
				p
					.use(remarkBreaksToParagraphs);
			}
		})
	);

	const fromStandardToCustom: TextProcessor = new TextProcessor();
	if (formatTo !== FwMarkdownFileFormat.Default) {
		fromStandardToCustom.add(new RemarkProcessor(p => {
				p
					.use(remarkDashes)
					.use(remarkKeepAllEmptyLines);

				if (formatTo === FwMarkdownFileFormat.IndentFirstLine) {
					p
						.use(remarkDisableCodeIndented)
						// .use(remarkBreaksToParagraphs)
						.use(remarkIndented);
				} else if (formatTo === FwMarkdownFileFormat.OneSentencePerLine) {
					p
						.use(remarkOneSentencePerLine);
				} else if (formatTo === FwMarkdownFileFormat.SingleBreakForNewParagraph) {
					p
						.use(remarkParagraphsAsHardBreaks);
				}
			}
		));
	}

	return new TextProcessor()
		.add(fromCustomToStandard)
		.add(fromStandardToCustom);

}

export const processorFactory = {
	create: create,
}