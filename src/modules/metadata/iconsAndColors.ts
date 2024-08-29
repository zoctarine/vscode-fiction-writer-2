import vscode from 'vscode';
import {isValidCodicon} from '../../core';

export class IconResolver {
    public defaultIcons = new Map<string, string>([
        ['pov', 'eye'],
        ['povs', 'eye'],
        ['tag', 'tag'],
        ['tags', 'tag'],
        ['character', 'organization'],
        ['characters', 'organization'],
        ['location', 'pinned'],
        ['locations', 'pinned'],
        ['state', 'play-circle'],
        ['status', 'pulse'],
        ['draft', 'primitive-dot'],
        ['title', 'code'],
        ['clock', 'clock'],
        ['time', 'clock'],
        ['hour', 'clock'],
        ['date', 'calendar'],
        ['info', 'info'],
        ['note', 'note'],
        ['warning', 'warning'],
        ['colors', 'symbol-color'],
        ['color', 'symbol-color'],
    ]);
    public allIcons = new Map<string, string>();

    public setCustom(customIcons: Map<string, string>, expandDefault: boolean = true) {
        this.allIcons = combineMaps(
            expandDefault ? this.defaultIcons : new Map<string, string>(),
            customIcons);

        makeLowercase(this.allIcons);
    }

    resolve(text?: string, color?: vscode.ThemeColor | undefined, resolveValues=false): vscode.ThemeIcon | undefined {
        if (!text) return undefined;
        text = text.trim();
        let icon = match(text, this.allIcons);
        if (resolveValues && !icon && isValidCodicon(text)) { icon=text;}

        return icon ? new vscode.ThemeIcon(icon, color) : undefined;
    }
}

export class ColorResolver {
    public knownColors = new Map<string, string>([
        ['blue', 'fictionWriter.blue'],
        ['lightblue', 'fictionWriter.lightblue'],
        ['teal', 'fictionWriter.teal'],
        ['red', 'fictionWriter.red'],
        ['lightred', 'fictionWriter.lightred'],
        ['lime', 'fictionWriter.lime'],
        ['green', 'fictionWriter.green'],
        ['orange', 'fictionWriter.orange'],
        ['amber', 'fictionWriter.amber'],
        ['lightamber', 'fictionWriter.lightamber'],
        ['purple', 'fictionWriter.purple'],
        ['bluegrey', 'fictionWriter.bluegrey'],
        ['grey', 'fictionWriter.grey'],
        ['yellow', 'fictionWriter.yellow'],
        ['pink', 'fictionWriter.pink'],
        ['white', 'fictionWriter.white'],
        ['black', 'fictionWriter.black']
    ]);
    public defaultColors = new Map<string, string>([

    ]);
    public allColors = new Map<string, string>();

    public setCustom(customColors: Map<string, string>, expandDefault: boolean = true) {
        customColors.forEach((value, key, map)=>map.set(key, 'fictionWriter.' + value));
        this.allColors = combineMaps(
            expandDefault ? this.defaultColors : new Map<string, string>(),
            customColors
        );

        makeLowercase(this.allColors);
    }

    resolve(text?: string, resolveValues=false): vscode.ThemeColor | undefined {
        if (!text) return undefined;
        text= text.trim();
        let color = match(text, this.allColors);
        if (resolveValues && !color && this.knownColors.has(text)) {
            color = this.knownColors.get(text);
        }
        return color ? new vscode.ThemeColor(color) : undefined;
    }
}

function match<V>(search: string, map: Map<string, V>, defaultValue?: V | undefined) {
    return map.get(search.toLowerCase()) ?? defaultValue;
}

function combineMaps<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
    const combinedMap = new Map(map1);
    for (const [key, value] of map2) {
        combinedMap.set(key, value);
    }
    return combinedMap;
}

function makeLowercase<V>(map: Map<string, V>) {
    map.forEach((value, key, map) => {
        map.set(key.toLowerCase(), value);
    });
}
