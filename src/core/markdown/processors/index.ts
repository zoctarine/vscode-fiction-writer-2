import {FwFormatting, FwMarkdownFileFormat} from '../formatting';
import {ITextProcessor, TextProcessor} from './TextProcessors';
import {MdIndentToStandard} from './MdIndentToStandard';
import {RemarkProcessor} from './RemarkProcessor';
import {remarkDashes} from '../plugins/remarkDashes';
import {remarkKeepEmptyLines} from '../plugins/remarkExpandParagraphs';
import {remarkIndented} from '../plugins/remarkIndented';
import {log} from '../../logging';

export * from './MdIndentToStandard';
export * from './RemarkProcessor';
export * from './TextProcessors';

export interface IFormatterFactoryOptions{
	format?: FwMarkdownFileFormat;
	convertFrom?: FwMarkdownFileFormat;
}
function create(options: Partial<IFormatterFactoryOptions>): ITextProcessor {
	const formatTo = options.format || FwFormatting.defaultFormat;
	const formatFrom = options.convertFrom || formatTo;

	const processor = new TextProcessor();
	if (formatFrom === FwMarkdownFileFormat.IndentFirstLine) {
		processor.add(new MdIndentToStandard());
	}
	processor.add(new RemarkProcessor(p => {
			p
				.use(remarkDashes)
				.use(remarkKeepEmptyLines);

			if (formatTo === FwMarkdownFileFormat.IndentFirstLine) {
				p.use(remarkIndented, {keepEmptyLinesBetweenParagraphs: true});
			}
		}
	));

	return processor;
}

export const processorFactory = {
	create: create,
}