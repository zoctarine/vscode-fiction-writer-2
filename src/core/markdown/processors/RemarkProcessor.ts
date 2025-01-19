import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import {ITextProcessor} from './TextProcessors';

export class RemarkProcessor implements ITextProcessor {

	constructor(private remarkConfig?: (processor: any) => any) {
	}

	process(data?: string): string | undefined {
		data ??= '';

		let processor = unified()
			.use(remarkParse)
			.use(remarkFrontmatter, ['yaml']);

		if (this.remarkConfig) {
			this.remarkConfig(processor);
		}

		processor
			.use(remarkStringify, {
				fences: false,
				bullet: '-',

			});

		return processor.processSync(data).toString();
	}
}