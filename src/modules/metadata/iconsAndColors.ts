import vscode from 'vscode';

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

        ['blue', 'circle-filled'],
        ['lightblue', 'circle-filled'],
        ['teal', 'circle-filled'],
        ['red', 'circle-filled'],
        ['lightred', 'circle-filled'],
        ['lime', 'circle-filled'],
        ['green', 'circle-filled'],
        ['orange', 'circle-filled'],
        ['amber', 'circle-filled'],
        ['lightamber', 'circle-filled'],
        ['purple', 'circle-filled'],
        ['bluegrey', 'circle-filled'],
        ['grey', 'circle-filled'],
        ['yellow', 'circle-filled'],
        ['pink', 'circle-filled'],
        ['white', 'circle-filled'],
        ['black', 'circle-filled']
    ]);
    public allIcons = new Map<string, string>();

    public setCustom(customIcons: Map<string, string>, expandDefault: boolean = true) {
        this.allIcons = combineMaps(
            expandDefault ? this.defaultIcons : new Map<string, string>(),
            customIcons);

        makeLowercase(this.allIcons);
    }

    resolve(text?: string, color?: vscode.ThemeColor | undefined): vscode.ThemeIcon | undefined {
        if (!text) return undefined;
        const icon = match(text, this.allIcons);
        return icon ? new vscode.ThemeIcon(icon, color) : undefined;
    }
}

export class ColorResolver {
    public defaultColors = new Map<string, string>([
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
    public allColors = new Map<string, string>();

    public setCustom(customColors: Map<string, string>, expandDefault: boolean = true) {
        customColors.forEach((value, key, map)=>map.set(key, 'fictionWriter.' + value));
        this.allColors = combineMaps(
            expandDefault ? this.defaultColors : new Map<string, string>(),
            customColors
        );

        makeLowercase(this.allColors);
    }

    resolve(text?: string): vscode.ThemeColor | undefined {
        if (!text) return undefined;
        const color = match(text, this.allColors);
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
