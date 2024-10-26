import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state';
import {log} from '../../logging';

export class SetMetaDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.metadata) return content;

        const colorMeta = data.metadata.value?.color
            ?  `fictionWriter.${data.metadata.value?.color}`
            : undefined;
        const iconMeta = data.metadata.value?.icon;
        const titleMeta = data.metadata.value?.title;
        const badgeMeta = this.generateAbbreviation(data.metadata.value?.badge?.toString());

        data.decoration = {
            ...data.decoration,
            icon: iconMeta,
            color: data.metadata.value?.compile === 'exclude'
                ? 'disabledForeground' : colorMeta,
            description: titleMeta,
            badge: badgeMeta,
            highlightColor:  undefined,
        };

        return content;
    }

    private generateAbbreviation(word: string): string | undefined {
        if (!word) return undefined;

        const lowerWord = word.toLowerCase();
        const vowels = "bcdfghklmnpqrstvwxyz";

        // Step 1: Take the first character
        const firstChar = lowerWord[0];

        // Step 2: Find the first vowel after the first character
        for (let i = 1; i < lowerWord.length; i++) {
            if (vowels.includes(lowerWord[i])) {
                return (firstChar + lowerWord[i]).toUpperCase();
            }
        }

        // Step 3: If no vowel found, take the second character
        const secondChar = lowerWord.length > 1 ? lowerWord[1] : '';

        return (firstChar + secondChar).toUpperCase();
    }
}