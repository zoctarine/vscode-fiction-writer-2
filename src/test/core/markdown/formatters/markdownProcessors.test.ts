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
import {MdStandardToIndented} from '../../../../core/markdown/processors/MdStandardToIndented';


function assertProcessed(fileName: string | { input: string, expected: string }, processor: ITextProcessor) {
	const fsInput = (typeof fileName === 'string')
		? path.join(__dirname, '__data', `${fileName}.in`)
		: path.join(__dirname, '__data', `${fileName.input}`);
	const fsExpected = (typeof fileName === 'string')
		? path.join(__dirname, '__data', `${fileName}.out`)
		: path.join(__dirname, '__data', `${fileName.expected}`);
	const dataIn = fs.readFileSync(fsInput, 'utf8');
	const dataOut = fs.readFileSync(fsExpected, 'utf8');
	const result = processor.process(dataIn);

	expect(result?.trimEnd()).toEqual(dataOut.trimEnd());
}

describe('markdownProcessors', () => {
	/**
	 * Just to have a reference on what the standard remarkParser/formatter does
	 */
	describe('standard', () => {

		describe('.reformat', () => {
			test.each([
				["standard.01.in", "standard.01.reformat.out"],
				["standard.02.in", "standard.02.reformat.out"],
				["standard.03.in", "standard.03.reformat.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new RemarkProcessor());
			});
		});


		describe('.reformat.keepEmptyLines', () => {
			test.each([
				["standard.03.in", "standard.03.reformat.emptyLines.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new RemarkProcessor(p => p
						.use(remarkKeepAllEmptyLines)
					)
				);
			});
		});

		describe('.reformat.dashes', () => {
			test.each([
				["standard.05.in", "standard.05.reformat.dashes.emptyLines.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new RemarkProcessor(p => p
						.use(remarkKeepAllEmptyLines)
						.use(remarkDashes)
					)
				);
			});
		});


		describe('.toIndented', () => {
			test.each([
				["standard.03.in", "standard.03.toInd.out"],
				["standard.04.in", "standard.04.toInd.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkIndented)
						))
				);
			});
		});

		describe('.toIndented.dashes', () => {
			test.each([
				["standard.05.in", "standard.05.toInd.dashes.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDashes)
							.use(remarkIndented)
						))
				);
			});
		});

		describe('.toIndented.emptyLines', () => {
			test.each([
				["standard.03.in", "standard.03.toInd.emptyLines.out"],
				["standard.04.in", "standard.04.toInd.emptyLines.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkKeepAllEmptyLines)
							.use(remarkIndented, {keepEmptyLinesBetweenParagraphs: true})
						))
				);
			});
		});

		describe('.toIndented.toStandard', () => {
			test.each([
				["standard.04.in", "standard.04.toInd.toStd.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkIndented)
						))
						.add(new MdIndentToStandard())
				);
			});
		});
	});

	describe('indented', () => {
		describe('.toStandard', () => {
			test.each([
				["indented.01.in", "indented.01.toStd.out"],
				["indented.02.in", "indented.02.toStd.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new MdIndentToStandard())
				);
			});
		});

		describe('.toStandard.ToIndented', () => {
			test.each([
				["indented.02.in", "indented.02.toStd.toInd.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new MdIndentToStandard())
						.add(new RemarkProcessor(p => p
							.use(remarkIndented, {keepEmptyLinesBetweenParagraphs: true})
						))
				);
			});
		});

		describe('.format.emptyLines', () => {
			test.each([
				["indented.01.in", "indented.01.reformat.emptyLines.out"],
				["indented.02.in", "indented.02.reformat.emptyLines.out"],
				// ["indented.03.in" ,"indented.03.format.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new MdIndentToStandard())
						.add(new RemarkProcessor(p => p
							.use(remarkKeepAllEmptyLines)
							.use(remarkIndented, {keepEmptyLinesBetweenParagraphs: true})
						))
				);
			});
		});
		describe('.format', () => {
			test.each([
				["indented.01.in", "indented.01.reformat.out"],
				["indented.02.in", "indented.02.reformat.out"],
				// ["indented.03.in" ,"indented.03.format.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new MdIndentToStandard(), {onProcess: r => console.log(r)})
						.add(new RemarkProcessor(), {onProcess: r => console.log(r)})
						.add(new RemarkProcessor(p => p
							.use(remarkIndented)
						))
				);
			});
		});

	});
});