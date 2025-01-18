import vscode, {QuickPickItem, QuickPickItemKind, ThemeColor, ThemeIcon} from 'vscode';
import {allKnownColors, allKnownIcons} from '../../core/decorations';

export async function selectMetadataIcon(selectedValue?: string) {
	let items: QuickPickItem[] = allKnownIcons.map(icon => ({
		label: icon,
		description: icon === selectedValue ? 'selected' : '',
		iconPath: new ThemeIcon(icon),

	}));

	if (selectedValue) {
		items = [
			{
				label: "Current icon",
				kind: QuickPickItemKind.Separator
			},
			{
				label: selectedValue,
				iconPath: new ThemeIcon(selectedValue),
			},
			{
				label: "All icons",
				kind: QuickPickItemKind.Separator
			},
			...items];
	}

	return (await vscode.window.showQuickPick(items, {
		title: 'icon:',
		placeHolder: `Start typing to filter icons. Press Enter to select, Escape to cancel`,
	}))?.label;
}

export async function selectMetadataColor(selectedValue?: string) {
	let items: QuickPickItem[] = allKnownColors.map(color => ({
		label: color,
		description: color === selectedValue ? 'selected' : '',
		// iconPath: new ThemeIcon(color, new ThemeColor(color)),

	}));

	if (selectedValue) {
		items = [
			{
				label: "Current color",
				kind: QuickPickItemKind.Separator
			},
			{
				label: selectedValue,
				// iconPath: new ThemeIcon('palette', new ThemeColor(selectedValue)),
			},
			{
				label: "All icons",
				kind: QuickPickItemKind.Separator
			},
			...items];
	}

	return (await vscode.window.showQuickPick(items, {
		title: 'color:',
		placeHolder: `Start typing to filter colors. Press Enter to select, Escape to cancel`,
	}))?.label;
}

export async function selectMetadataTarget(selectedValue?: string) {

	return (await vscode.window.showInputBox({
		title: 'target:',
		value: selectedValue,
		prompt: `Enter a target word count.`,
		validateInput: (input) => {
			const number = Number(input);
			return isNaN(number) || number < 0 ? 'Please enter a valid, positive, number' : null;
		}
	}));
}