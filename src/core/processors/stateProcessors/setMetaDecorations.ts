import {IStateProcessor} from '../IProcessor';
import {applyDecorations, IFileState} from '../../state';
import {log} from '../../logging';
import {CoreColors} from '../../decorations';

export class SetMetaDecorations implements IStateProcessor<IFileState> {
    async process(state: IFileState) {
        if (!state.metadata) return;

        const metaDecorations = {
            icon: state.metadata?.icon,
            color: state.metadata?.compile === 'exclude'
                ? CoreColors.inactive : state.metadata?.color
                    ? `fictionWriter.${state.metadata?.color}`
                    : undefined,
            description: state.metadata?.title,
            badge: this.generateAbbreviation(state.metadata?.badge?.toString()),
            highlightColor: undefined,
        };
        applyDecorations(state.metadataDecorations, metaDecorations);
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