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


function assertProcessed(fileName: string, processor: ITextProcessor) {
	const fsInput = path.join(__dirname, '__data', `${fileName}.in`);
	const fsExpected = path.join(__dirname, '__data', `${fileName}.out`);
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
		test.each([
			"standard.01",
			"standard.02.withMeta",
			"standard.03.unformatted"
		])('file %s', (fileName) => {
			assertProcessed(fileName, new RemarkProcessor());
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

	describe('remarkSplitCodeToParagraphs', () => {
		test.each([
			"remarkSplitCodeToParagraphs.01",
		])('file %s', (fileName) => {
			assertProcessed(fileName,
				new TextProcessor()
					.add(new MdIndentToStandard())
					.add(new RemarkProcessor())
				);
		});
	});

	describe('indentToStandard', () => {
		test.each([
			"indented.toStd.01",
			"indented.toStd.02",
		])('file %s', (fileName) => {
			assertProcessed(fileName,
				new TextProcessor()
					.add(new MdIndentToStandard())
				);
		});
	});

	describe('standardToIndented', () => {
		test.each([
			"standard.toInd.01",
			"standard.toInd.02",
		])('file %s', (fileName) => {
			assertProcessed(fileName,
				new TextProcessor()
					.add(new MdStandardToIndented())
			);
		});
	});

	describe('standard to indented and back to standard', () => {
		test.each([
			"standard.toInd.toStd.01",
		])('file %s', (fileName) => {
			assertProcessed(fileName,
				new TextProcessor()
					.add(new MdStandardToIndented())
					.add(new MdIndentToStandard())
			);
		});
	});

	describe('indented to standard and back to indented', () => {
		test.each([
			"indented.toStd.toInd",
		])('file %s', (fileName) => {
			assertProcessed(fileName,
				new TextProcessor()
					.add(new MdIndentToStandard())
					.add(new MdStandardToIndented())
			);
		});
	});

	describe('formatIndented', () => {
		test.each([
			"ind.format.01",
		])('file %s', (fileName) => {
			assertProcessed(fileName,
				new TextProcessor()
					.add(new MdIndentToStandard())
					.add(new RemarkProcessor(u =>
						u.use(remarkKeepEmptyLines)))
					.add(new MdStandardToIndented())
			);
		});
	});
});