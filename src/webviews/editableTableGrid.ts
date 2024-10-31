import { getNonce } from "../utilities/getNonce";
import {
  provideVSCodeDesignSystem,
  vsCodeDataGrid,
  vsCodeDataGridCell,
  vsCodeDataGridRow,
  DataGrid,
  DataGridCell,
} from "@vscode/webview-ui-toolkit";

const nonce = getNonce();

provideVSCodeDesignSystem().register(
  vsCodeDataGrid(),
  vsCodeDataGridCell(),
  vsCodeDataGridRow()
);

// Initial load show welcome view
window.addEventListener("load", initPropertiesTable);

// Load properties for selected element
// window.addEventListener('message', event => main(JSON.parse(event.data).properties));
window.addEventListener("message", (event) => {
  const payload = JSON.parse(event.data);

  // This does not account for nested `properties`
  // in multidimensional objects.
  // TODO: We need a more comprehsive solutoin for
  // finding the "closes" properties object.
  if (payload.hasOwnProperty("properties")) {
    initPropertiesTable(JSON.parse(event.data)?.properties);
  }
});

/**
 *
 * @param properties
 * @returns
 */
function initPropertiesTable(properties?: any) {
  // Define default data grid
  const basicDataGrid = document.getElementById(
    "properties-editor"
  ) as DataGrid;

  basicDataGrid.columnDefinitions = [
    { columnDataKey: "property", title: "Property" },
    { columnDataKey: "value", title: "Value" },
  ];

  basicDataGrid.rowsData = [];

  // TODO: Can this be refactored?
  Object.keys(properties).map((property) =>
    basicDataGrid.rowsData.push({ property, value: properties[property] })
  );

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
    if (cell.className === "column-header") {
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
    cell.addEventListener("click", handleClickClosure, { once: true });
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
  if (
    !cell.hasAttribute("contenteditable") ||
    cell.getAttribute("contenteditable") === "false"
  ) {
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
  const row = cell.rowData;

  if (column && row) {
    const originalValue = row[column.columnDataKey];
    const newValue = cell.innerText;

    if (originalValue !== newValue) {
      row[column.columnDataKey] = newValue;
    }
  }
}
