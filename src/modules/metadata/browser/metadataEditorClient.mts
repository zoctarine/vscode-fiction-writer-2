import {
	provideVSCodeDesignSystem,
	vsCodeDataGrid,
	vsCodeDataGridCell,
	vsCodeDataGridRow,
	vsCodeTextArea,
	DataGrid,
	DataGridCell,
} from "@vscode/webview-ui-toolkit";

import {ViewTemplate, html, css, customElement, FASTElement} from '@microsoft/fast-element';

const template = html`
    <i class="${x => x.rowData.icon}"></i>
`;


provideVSCodeDesignSystem().register(
	vsCodeDataGrid(), vsCodeDataGridCell(), vsCodeDataGridRow(),
	vsCodeTextArea());

window.addEventListener("load", main);

function main() {
	// Define default data grid
	const basicDataGrid = document.getElementById("basic-grid") as DataGrid;
	// Random data generated using https://generatedata.com/
	basicDataGrid.rowsData = [
		{
			icon: "fas fa-star",
			key: "state",
			value: "draft",
		},
		{
			icon: "fas fa-user",
			key: "pov",
			value: "Andrei",
		},
		{
			icon: "fas fa-globe",
			key: "location",
			value: "Brazil",
		},
		{
			icon: "fas fa-tags",
			key: "tags",
			value: "acasa, ceva, nou",
		}
	];
	basicDataGrid.columnDefinitions = [
		{columnDataKey: "icon", title: "Key", cellTemplate: template},
		{columnDataKey: "key", title: "Key"},
		{columnDataKey: "value", title: "Value"},
	];
	// basicDataGrid.generateHeader = "none";  grid-template-columns="100px 10vw 3fr 30%"

	basicDataGrid.generateHeader = "none";
	basicDataGrid.gridTemplateColumns = "20px 70px 2fr";
	// Initialize editable data grid
	initEditableDataGrid("basic-grid");
}

function initEditableDataGrid(id: string) {
	const grid = document.getElementById(id) as DataGridCell;

	grid?.addEventListener("cell-focused", (e: Event) => {
		const cell = e.target as DataGridCell;
		// Do not continue if `cell` is undefined/null or is not a grid cell
		if (!cell || cell.role !== "gridcell") {
			return;
		}
		// Do not allow data grid header cells to be editable
		if (cell.className === "column-header" || cell.style.gridColumn === "1") {
			return;
		}

		// Note: Need named closures in order to later use removeEventListener
		// in the handleBlurClosure function
		const handleKeydownClosure = (e: KeyboardEvent) => {
			handleKeydown(e, cell);
		};
		const handleClickClosure = () => {
			setCellEditable(cell);
		};
		const handleBlurClosure = () => {
			syncCellChanges(cell);
			unsetCellEditable(cell);
			// Remove the blur, keydown, and click event listener _only after_
			// the cell is no longer focused
			cell.removeEventListener("blur", handleBlurClosure);
			cell.removeEventListener("keydown", handleKeydownClosure);
			cell.removeEventListener("click", handleClickClosure);
		};

		cell.addEventListener("keydown", handleKeydownClosure);
		// Run the click listener once so that if a cell's text is clicked a
		// second time the cursor will move to the given position in the string
		// (versus reselecting the cell text again)
		cell.addEventListener("click", handleClickClosure, {once: true});
		cell.addEventListener("blur", handleBlurClosure);
	});
}

// Make a given cell editable
function setCellEditable(cell: DataGridCell) {
	cell.setAttribute("contenteditable", "true");
	selectCellText(cell);
}

// Handle keyboard events on a given cell
function handleKeydown(e: KeyboardEvent, cell: DataGridCell) {
	if (!cell.hasAttribute("contenteditable") || cell.getAttribute("contenteditable") === "false") {
		if (e.key === "Enter") {
			e.preventDefault();
			setCellEditable(cell);
		}
	} else {
		if (e.key === "Enter" || e.key === "Escape") {
			e.preventDefault();
			syncCellChanges(cell);
			unsetCellEditable(cell);
		}
	}
}

// Make a given cell non-editable
function unsetCellEditable(cell: DataGridCell) {
	cell.setAttribute("contenteditable", "false");
	deselectCellText();
}

// Select the text of an editable cell
function selectCellText(cell: DataGridCell) {
	const selection = window.getSelection();
	if (selection) {
		const range = document.createRange();
		range.selectNodeContents(cell);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

// Deselect the text of a cell that was previously editable
function deselectCellText() {
	const selection = window.getSelection();
	if (selection) {
		selection.removeAllRanges();
	}
}

// Syncs changes made in an editable cell with the
// underlying data structure of a vscode-data-grid
function syncCellChanges(cell: DataGridCell) {
	const column = cell.columnDefinition;
	const row: any = cell.rowData;

	if (column && row) {
		const originalValue = row[column.columnDataKey];
		const newValue = cell.innerText;

		if (originalValue !== newValue) {
			row[column.columnDataKey] = newValue;
		}
	}
}

