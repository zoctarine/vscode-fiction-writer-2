import {MdiIcons} from '../../core';
import {ITextProcessor} from '../IProcessor';
import {IDecorationState, IMetaState, IWriteTargetsState} from '../states';

export class SetWriteTargetDecorations implements ITextProcessor {
    constructor(public namedDecoration?: string) {
    }

    async process(content: string, data: {
        targets?: IWriteTargetsState,
        decoration?: IDecorationState,
    }): Promise<string> {
        if (!data.targets) {
            return content;
        }

        const steps = new Map<number, { icon: string, color: string }>([
            [0, {icon: MdiIcons.hourglassEmpty, color: 'orange'}],
            [10, {icon: MdiIcons.clockLoader10, color: 'amber'}],
            [20, {icon: MdiIcons.clockLoader20, color: 'amber'}],
            [40, {icon: MdiIcons.clockLoader40, color: 'yellow'}],
            [60, {icon: MdiIcons.clockLoader60, color: 'yellow'}],
            [80, {icon: MdiIcons.clockLoader80, color: 'lime'}],
            [90, {icon: MdiIcons.clockLoader90, color: 'lime'}],
            [100, {icon: MdiIcons.taskAlt, color: 'lime'}],
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

        const step = getNearestStep(data.targets.wordsTargetAchieved ?? 0, [...steps.keys()]);
        const newDecoration: IDecorationState = {
            ...data.decoration,
            icon: steps.get(step)?.icon,
            color: steps.get(step)?.color,
            description: data.targets.progress
        };


        if (this.namedDecoration){
            if (!data.decoration?.named){
                data.decoration = {...data.decoration, named: new Map<string, IDecorationState>()};
            }

            data.decoration.named!.set(this.namedDecoration, newDecoration);

        } else {
            data.decoration = newDecoration;
        }


        return content;
    }
}