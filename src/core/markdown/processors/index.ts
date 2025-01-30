import {FwFormatting, FwMarkdownFileFormat} from '../formatting';
import {ITextProcessor, TextProcessor} from './TextProcessors';
import {RemarkProcessor} from './RemarkProcessor';
import {
	remarkDashes,
	remarkKeepAllEmptyLines,
	remarkIndented,
	remarkOneSentencePerLine,
	remarkSoftBreaksRemove,
	remarkBreaksToParagraphs,
	remarkDisableCodeIndented,
	remarkParagraphsAsBreaks
} from '../plugins';

export * from './MdIndentToStandard';
export * from './RemarkProcessor';
export * from './TextProcessors';

export interface IFormatterFactoryOptions {
	format?: FwMarkdownFileFormat;
	convertFrom?: FwMarkdownFileFormat;
}

const from: Map<FwMarkdownFileFormat, (processor: any) => any> = new Map();
const to: Map<FwMarkdownFileFormat, (processor: any) => any> = new Map();

/**
 * INDENT FIRST LINE
 */

to.set(FwMarkdownFileFormat.IndentFirstLine, p => p
	.use(remarkDisableCodeIndented)
	// .use(remarkBreaksToParagraphs)
	.use(remarkIndented));

from.set(FwMarkdownFileFormat.IndentFirstLine, p => p
	.use(remarkDisableCodeIndented)
	.use(remarkBreaksToParagraphs));

/**
 *  ONE SENTENCE PER LINE
 */

to.set(FwMarkdownFileFormat.OneSentencePerLine, p => p
	.use(remarkOneSentencePerLine));

from.set(FwMarkdownFileFormat.OneSentencePerLine, p => p
	.use(remarkSoftBreaksRemove));

/**
 * SINGLE PARAGRAPH BREAK
 */
to.set(FwMarkdownFileFormat.SingleBreakForNewParagraph, p => p
	.use(remarkParagraphsAsBreaks));

from.set(FwMarkdownFileFormat.SingleBreakForNewParagraph, p => p
	.use(remarkBreaksToParagraphs));


/**
 * Create Format Converter/Processor
 * @param options
 */
function create(options: Partial<IFormatterFactoryOptions>): ITextProcessor {
	const formatTo = options.format || FwFormatting.defaultFormat;
	const formatFrom = options.convertFrom || formatTo;

	const common = (processor: any) => processor
		.use(remarkDashes)
		.use(remarkKeepAllEmptyLines);

	const fromCustomToStandard = new TextProcessor()
		.add(new RemarkProcessor(processor => {
				common(processor);
				const enhance = from.get(formatFrom);
				if (enhance) enhance(processor);
			})
		);

	const fromStandardToCustom = new TextProcessor();

	if (formatTo !== FwFormatting.defaultFormat) {
		fromStandardToCustom
			.add(new RemarkProcessor(processor => {
					common(processor);
					const enhance = to.get(formatTo);
					if (enhance) enhance(processor);
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