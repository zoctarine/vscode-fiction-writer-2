import {expect, test} from 'vitest';
import fs from 'fs';
import path from 'path';
import {
	ITextProcessor, TextProcessor, RemarkProcessor
} from '../../../../core/markdown/processors';
import {
	remarkDashes,
	remarkIndented,
	remarkSoftBreaksRemove,
	remarkOneSentencePerLine,
	remarkBreaksToParagraphs,
	remarkParagraphsAsBreaks,
	remarkDisableCodeIndented,
	remarkKeepAllEmptyLines
} from '../../../../core/markdown/plugins';


function assertProcessed(
	fileName: string | { input: string, expected: string },
	processor: ITextProcessor | ITextProcessor[]) {

	const fsInput = path.join(__dirname, '__data',
		(typeof fileName === 'string' ? `${fileName}.in` : fileName.input)
	);

	const fsExpected = path.join(__dirname, '__data',
		(typeof fileName === 'string' ? `${fileName}.out` : fileName.expected)
	);

	const dataIn = fs.readFileSync(fsInput, 'utf8');
	const dataOut = fs.readFileSync(fsExpected, 'utf8');

	if (!Array.isArray(processor)) processor = [processor];

	let result: string | undefined = dataIn;
	for (const proc of processor) {
		result = proc.run(result, {});
	}


	expect(result?.trimEnd()).toEqual(dataOut.trimEnd());
}

describe('markdownProcessors', () => {
	/**
	 * Just to have a reference on what the standard remarkParser/formatter does
	 */
	describe('standard', () => {

		describe('.reformat', () => {
			test.each([
				["./standard/standard.01.in", "./standard/standard.01.reformat.out"],
				["./standard/standard.02.in", "./standard/standard.02.reformat.out"],
				["./standard/standard.03.in", "./standard/standard.03.reformat.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new RemarkProcessor());
			});
		});


		describe('.reformat.keepEmptyLines', () => {
			test.each([
				["./standard/standard.03.in", "./standard/standard.03.reformat.emptyLines.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new RemarkProcessor(p => p
						.use(remarkKeepAllEmptyLines)
					)
				);
			});
		});

		describe('.reformat.softBreaks', () => {
			test.each([
				["./standard/standard.03.in", "./standard/standard.03.reformat.softBreaks.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new RemarkProcessor(p => p
						.use(remarkKeepAllEmptyLines)
						.use(remarkSoftBreaksRemove)
					)
				);
			});
		});

		describe('.reformat.dashes', () => {
			test.each([
				["./standard/standard.05.in", "./standard/standard.05.reformat.dashes.emptyLines.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new RemarkProcessor(p => p
						.use(remarkKeepAllEmptyLines)
						.use(remarkDashes)
					)
				);
			});
		});

		describe('.toHardBreaks', () => {
			test.each([
				["./standard/standard.04.in", "./standard/standard.04.toHb.out"],
				["./standard/standard.05.in", "./standard/standard.05.toHb.dashes.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDashes)
							.use(remarkParagraphsAsBreaks)
						))
				);
			});
		});
		describe('.toHardBreaks.emptyLines', () => {
			test.each([
				["./standard/standard.04.in", "./standard/standard.04.toHb.emptyLines.out"],
				// ["./standard/standard.05.in", "./standard/standard.05.toHb.emptyLines.dashes.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDashes)
							.use(remarkKeepAllEmptyLines)
							.use(remarkParagraphsAsBreaks)
						))
				);
			});
		});

		describe('.toIndented', () => {
			test.each([
				["./standard/standard.03.in", "./standard/standard.03.toInd.out"],
				["./standard/standard.04.in", "./standard/standard.04.toInd.out"],
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
				["./standard/standard.05.in", "./standard/standard.05.toInd.dashes.out"]
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
				["./standard/standard.03.in", "./standard/standard.03.toInd.emptyLines.out"],
				["./standard/standard.04.in", "./standard/standard.04.toInd.emptyLines.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkKeepAllEmptyLines)
							.use(remarkIndented)
						))
				);
			});
		});

		describe('.toIndented.toStandard', () => {
			test.each([
				["./standard/standard.04.in", "./standard/standard.04.toInd.toStd.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkIndented)
						))
						.add(new RemarkProcessor(p => p
							.use(remarkDisableCodeIndented)
							.use(remarkBreaksToParagraphs)
						))
				);
			});
		});

		describe('.toOspl', () => {
			test.each([
				["./standard/standard.03.in", "./standard/standard.03.toOspl.out"],
				["./standard/standard.05.in", "./standard/standard.05.toOspl.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDashes)
							.use(remarkSoftBreaksRemove)
							.use(remarkOneSentencePerLine)
						))
				);
			});
		});
	});

	describe('indented', () => {
		describe('.toStandard', () => {
			test.each([
				["./indented/indented.01.in", "./indented/indented.01.toStd.out"],
				["./indented/indented.02.in", "./indented/indented.02.toStd.out"],
				["./indented/indented.03.in", "./indented/indented.03.toStd.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDisableCodeIndented)
							.use(remarkKeepAllEmptyLines)
							.use(remarkBreaksToParagraphs)
						))
				);
			});
		});

		describe('.toStandard.ToIndented', () => {
			test.each([
				["./indented/indented.02.in", "./indented/indented.02.toStd.toInd.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, [
						new TextProcessor()
							.add(new RemarkProcessor(p => p
								.use(remarkDisableCodeIndented)
								.use(remarkKeepAllEmptyLines)
								.use(remarkBreaksToParagraphs)
							)),
						new TextProcessor()
							.add(new RemarkProcessor(p => p
								.use(remarkKeepAllEmptyLines)
								.use(remarkIndented)
							))
					]
				);
			});
		});

		describe('.format.emptyLines', () => {
			test.each([
				["./indented/indented.01.in", "./indented/indented.01.reformat.emptyLines.out"],
				["./indented/indented.02.in", "./indented/indented.02.reformat.emptyLines.out"],
				// ["./indented/indented.03.in" ,"./indented/indented.03.format.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDisableCodeIndented)
							.use(remarkKeepAllEmptyLines)
							.use(remarkBreaksToParagraphs)
						))
						.add(new RemarkProcessor(p => p
							.use(remarkKeepAllEmptyLines)
							.use(remarkIndented)
						))
				);
			});
		});

		describe('.format.dashes', () => {
			test.each([
				["./indented/indented.03.in", "./indented/indented.03.reformat.dashes.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDisableCodeIndented)
							.use(remarkKeepAllEmptyLines)
							.use(remarkBreaksToParagraphs)
						))
						.add(new RemarkProcessor(p => p
							.use(remarkKeepAllEmptyLines)
							.use(remarkDashes)
							.use(remarkIndented)
						))
				);
			});
		});

		describe('.format', () => {
			test.each([
				["./indented/indented.01.in", "./indented/indented.01.reformat.out"],
				["./indented/indented.02.in", "./indented/indented.02.reformat.out"],
				// ["./indented/indented.03.in" ,"./indented/indented.03.format.out"],
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected},
					new TextProcessor()
						.add(new RemarkProcessor(p => p
							.use(remarkDisableCodeIndented)
							.use(remarkKeepAllEmptyLines)
							.use(remarkBreaksToParagraphs)
						))
						.add(new RemarkProcessor())
						.add(new RemarkProcessor(p => p
							.use(remarkIndented)
						))
				);
			});
		});

	});

	describe('oneSentencePerLine', () => {

		describe('.toStandard', () => {
			test.each([
				["./ospl/ospl.03.in", "./ospl/ospl.03.toStd.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new TextProcessor()
					.add(new RemarkProcessor(p => p
						.use(remarkSoftBreaksRemove)
					))
				);
			});
		});

	});

	describe('hardbreaks', () => {

		describe('.toStandard', () => {
			test.each([
				["./hardbreaks/hardbreaks.01.in", "./hardbreaks/hardbreaks.01.toStd.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new TextProcessor()
					.add(new RemarkProcessor(p => p
						.use(remarkBreaksToParagraphs)
					))
				);
			});
		});

		describe('.toStandard.toHardBreaks', () => {
			test.each([
				["./hardbreaks/hardbreaks.01.in", "./hardbreaks/hardbreaks.01.toStd.toHb.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, [
					new TextProcessor()
						.add(new RemarkProcessor(p => p
								.use(remarkKeepAllEmptyLines)
								.use(remarkBreaksToParagraphs)
							)
						),
					new TextProcessor()
						.add(new RemarkProcessor(p => p
								.use(remarkKeepAllEmptyLines)
								.use(remarkParagraphsAsBreaks)
							)
						)
				]);
			});
		});

		describe('.toStandard.keepEmptyLines', () => {
			test.each([
				["./hardbreaks/hardbreaks.01.in", "./hardbreaks/hardbreaks.01.toStd.emptyLines.out"]
			])('from [%s] to [%s]', (input, expected) => {
				assertProcessed({input, expected}, new TextProcessor()
					.add(new RemarkProcessor(p => p
						.use(remarkKeepAllEmptyLines)
						.use(remarkBreaksToParagraphs)
					))
				);
			});
		});

	});
});