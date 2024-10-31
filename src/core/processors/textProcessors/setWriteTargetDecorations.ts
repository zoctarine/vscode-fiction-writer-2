import {MdiIcons} from '../../decorations';
import {ITextProcessor} from '../IProcessor';
import {IFileState} from '../../state/states';

export class SetWriteTargetDecorations implements ITextProcessor<IFileState> {
    async process(content: string, data: IFileState): Promise<string> {
        if (!data.writeTargets) {
            return content;
        }

        const steps = new Map<number, { icon: string, color: string }>([
            [0, {icon: MdiIcons.hourglassEmpty, color: 'fictionWriter.red'}],
            [10, {icon: MdiIcons.clockLoader10, color: 'fictionWriter.lightred'}],
            [20, {icon: MdiIcons.clockLoader20, color: 'fictionWriter.orange'}],
            [40, {icon: MdiIcons.clockLoader40, color: 'fictionWriter.amber'}],
            [60, {icon: MdiIcons.clockLoader60, color: 'fictionWriter.yellow'}],
            [80, {icon: MdiIcons.clockLoader80, color: 'fictionWriter.lime'}],
            [90, {icon: MdiIcons.clockLoader90, color: 'fictionWriter.lime'}],
            [100, {icon: MdiIcons.taskAlt, color: 'fictionWriter.green'}],
        ]);


        function getNearestStep(value: number, steps: number[]): number {
            if (value === 0) return 0;
            const sortedSteps = steps.sort((a, b) => a - b);

            for (let i = 0; i < sortedSteps.length; i++) {
                if (sortedSteps[i] > value) {
                    return sortedSteps[i];
                }
            }

            return steps[steps.length - 1];
        }

        const step = getNearestStep(data.writeTargets.wordsTargetAchieved ?? 0, [...steps.keys()]);

        data.writeTargetsDecorations = {
            ...data.writeTargetsDecorations,
            icon: steps.get(step)?.icon,
            color: steps.get(step)?.color,
            description: data.writeTargets.progress
        };


        return content;
    }
}