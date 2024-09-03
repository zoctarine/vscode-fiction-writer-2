/**
 * The Font Awesome Icons use in the extension
 */
export const FwColors = {
    blue: 'fictionWriter.blue',
    lightblue: 'fictionWriter.lightblue',
    teal: 'fictionWriter.teal',
    red: 'fictionWriter.red',
    lightred: 'fictionWriter.lightred',
    lime: 'fictionWriter.lime',
    green: 'fictionWriter.green',
    orange: 'fictionWriter.orange',
    amber: 'fictionWriter.amber',
    lightamber: 'fictionWriter.lightamber',
    purple: 'fictionWriter.purple',
    bluegrey: 'fictionWriter.bluegrey',
    grey: 'fictionWriter.grey',
    yellow: 'fictionWriter.yellow',
    pink: 'fictionWriter.pink',
    white: 'fictionWriter.white',
    black: 'fictionWriter.black'
};

export const KnownColors = {
    foreground: 'foreground',
    disabledForeground: 'descriptionForeground',
}


export const allKnownColors: string[] = [
    ...Object.keys(FwColors).map(v => v.toString()),
    ...Object.values(KnownColors).map(v => v.toString()),
];
