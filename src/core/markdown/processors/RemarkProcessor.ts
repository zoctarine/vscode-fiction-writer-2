import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import {ITextProcessor, ITextProcessorContext} from './TextProcessors';

export class RemarkProcessor implements ITextProcessor {

	constructor(private remarkConfig?: (processor: any, context:any) => any) {
	}

	run(data?: string, context?:ITextProcessorContext): string | undefined {
		data ??= '';

		let processor = unified()
			// @ts-ignore
			.data('context', {})
			.use(remarkParse)
			.use(remarkFrontmatter, ['yaml']);

		if (this.remarkConfig) {
			this.remarkConfig(processor, context);
		}

		processor
			.use(remarkStringify, {
				// fences: false,
				bullet: '-',
			});

		return processor.processSync(data).toString();
	}
}