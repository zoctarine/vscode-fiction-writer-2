import {remarkDashes} from '../../../../core/markdown/plugins/remarkDashes';
import {expect, test} from 'vitest';
import fs from 'fs';
import path from 'path';
import {remarkKeepEmptyLines} from '../../../../core/markdown/plugins/remarkKeepEmptyLines';
import {
	ITextProcessor, TextProcessor
} from '../../../../core/markdown/processors/TextProcessors';
import {RemarkProcessor} from '../../../../core/markdown/processors/RemarkProcessor';
import {remarkIndented} from '../../../../core/markdown/plugins/remarkIndented';
import {remarkParagraphsToCodeBlock} from '../../../../core/markdown/plugins/mergeParagrapshToCode';
import {remarkSplitCodeToParagraphs} from '../../../../core/markdown/plugins/splitCodeToParagraph';
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

		describe('.toIndented', () => {
			test.each([
				["standard.04.in", "standard.04.toInd.out"],
				["standard.05.in", "standard.05.toInd.out"]
			])('file %s', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new MdStandardToIndented())
				);
			});
		});

		describe('.toIndented.toStandard', () => {
			test.each([
				["standard.04.in", "standard.04.toInd.toStd.out"],
				["standard.05.in", "standard.05.in"]
			])('file %s',(input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new MdStandardToIndented())
						.add(new MdIndentToStandard())
				);
			});
		});
	});

	describe('remarkDashes', () => {
		test.each([
			"remarkDashes.01",
		])('file %s', (fileName) => {
			assertProcessed(fileName, new RemarkProcessor(p => p.use(remarkDashes)));
		});
	});

	describe('remarkKeepEmptyLines', () => {
		test.each([
			"remarkKeepEmptyLines.01",
		])('file %s', (fileName) => {
			assertProcessed(fileName, new RemarkProcessor(p => p.use(remarkKeepEmptyLines)));
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
						.add(new MdStandardToIndented())
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
						.add(new RemarkProcessor(u =>
							u.use(remarkKeepEmptyLines)))
						.add(new MdStandardToIndented())
				);
			});

			describe('.format', () => {
				test.each([
					["indented.01.in", "indented.01.reformat.out"],
					["indented.02.in", "indented.02.reformat.out"],
					// ["indented.03.in" ,"indented.03.format.out"],
				])('from [%s] to [%s]', (input, expected) => {
					assertProcessed({input, expected},
						new TextProcessor()
							.add(new MdIndentToStandard())
							.add(new RemarkProcessor())
							.add(new MdStandardToIndented())
					);
				});
			});
		});
	});
});