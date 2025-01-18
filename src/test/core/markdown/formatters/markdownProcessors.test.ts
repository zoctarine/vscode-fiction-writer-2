import {remarkDashes} from '../../../../core/markdown/plugins/remarkDashes';
import {expect, test} from 'vitest';
import fs from 'fs';
import path from 'path';
import {remarkKeepEmptyLines} from '../../../../core/markdown/plugins/remarkKeepEmptyLines';
import {
	ITextProcessor, MdIndentToStandard, TextProcessor
} from '../../../../core/markdown/processors/TextProcessors';
import {RemarkProcessor} from '../../../../core/markdown/processors/RemarkProcessor';
import {remarkIndented} from '../../../../core/markdown/plugins/remarkIndented';
import {remarkParagraphsToCodeBlock} from '../../../../core/markdown/plugins/mergeParagrapshToCode';
import {remarkSplitCodeToParagraphs} from '../../../../core/markdown/plugins/splitCodeToParagraph';


function assertProcessed(fileName: string, processor: ITextProcessor, ext = 'md') {
	const fsInput = path.join(__dirname, '__data', `${fileName}.in.${ext}`);
	const fsExpected = path.join(__dirname, '__data', `${fileName}.out.${ext}`);
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
				, 'txt');
		});
	});

	describe('mdIndentToStandard', () => {
		test.each([
			"mdIndentToStandard.01",
		])('file %s', (fileName) => {
			assertProcessed(fileName,
				new TextProcessor()
					.add(new MdIndentToStandard())
				, 'txt');
		});
	});
});