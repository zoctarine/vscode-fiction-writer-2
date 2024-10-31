import {IDecorationState} from './states';

export * from './stateManager';
export * from './fwFileState';
export * from './states';

export function applyDecorations(...decorations: (IDecorationState | undefined)[]): IDecorationState {
    const result: IDecorationState = {};

    for (const decoration of decorations) {
        if (!decoration) continue;
        for (const key in decoration) {
            const typedKey = key as keyof IDecorationState;
            const value = decoration[typedKey] as any;
            if (value !== undefined && value !== null) {
                result[typedKey] = value;
            }
        }
    }
    return result;
}