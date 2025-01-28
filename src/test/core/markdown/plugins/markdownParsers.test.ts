import {remarkDashes} from '../../../../core/markdown/plugins/remarkDashes';
import {expect, test} from 'vitest';
import fs from 'fs';
import path from 'path';
import {remarkKeepAllEmptyLines} from '../../../../core/markdown/plugins/remarkKeepAllEmptyLines';
import {
	ITextProcessor, TextProcessor
} from '../../../../core/markdown/processors/TextProcessors';
import {RemarkProcessor} from '../../../../core/markdown/processors/RemarkProcessor';
import {remarkIndented} from '../../../../core/markdown/plugins/remarkIndented';
import {MdIndentToStandard} from '../../../../core/markdown/processors/MdIndentToStandard';
import remarkBreaks from 'remark-breaks';
import {remarkSoftBreaksRemove} from '../../../../core/markdown/plugins/remarkSoftBreaksRemove';
import {remarkOneSentencePerLine} from '../../../../core/markdown/plugins/remarkOneSentencePerLine';
import {Processor, unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import {remarkBreaksToParagraphs} from '../../../../core/markdown/plugins/remarkBreaksToParagraphs';
import {remarkDisableCodeIndented} from '../../../../core/markdown/plugins/remarkDisable';


function run(fileName: string | { input: string, expected: string }, plugin: (p:Processor) => any) {
	const fsInput = path.join(__dirname, '__data',
		(typeof fileName === 'string' ? `${fileName}.in` : fileName.input)
	);

	const fsExpected = path.join(__dirname, '__data',
		(typeof fileName === 'string' ? `${fileName}.out` : fileName.expected)
	);

	const dataIn = fs.readFileSync(fsInput, 'utf8');
	const dataOut = fs.readFileSync(fsExpected, 'utf8');
	const expected = JSON.parse(dataOut);

	let processor = unified()
		.use(remarkParse)
		.use(remarkFrontmatter, ['yaml']);

	if (plugin)
		plugin(processor as any as Processor);

		processor.use(remarkStringify);

	const result = processor.processSync(dataIn).toString();
	expect(result).toEqual(dataIn);
	expect(result).toEqual(expected);
	return result;
}

describe('markdown.parsers', () => {
	/**
	 * Just to have a reference on what the standard remarkParser/formatter does
	 */
	describe('standard', () => {


		describe('.reformat', () => {
			test.each([
				["./indented.01.in", "./indented.01.remarkIndented.json"],
			])('from [%s] to [%s]', (input, expected) => {
				const result = run({input, expected},
					p => p
						.use(remarkDisableCodeIndented)
						.use(remarkBreaksToParagraphs)
						.use(remarkIndented)
				);
			});
		});

	});
});