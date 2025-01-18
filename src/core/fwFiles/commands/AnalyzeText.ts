import {ICommand} from '../../lib';
import {IMarkdownMeta} from '../IMarkdownMeta';
import {FileEncryptor} from '../../../modules/security/fileEncryptor';
import {ITextStatistics, TextAnalyzer} from '../../../modules/textAnalysis/textAnalyzer';

export class AnalyzeText implements ICommand<string, ITextStatistics | undefined> {

	run(text?: string) {
		if (!text || text.length === 0) return;

		return TextAnalyzer.analyze(text);
	}
}