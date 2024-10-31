// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { BasicEditorCanvas } from "./basicEditorCanvas";
import { BasicEditorCanvasPreview } from "./basicEditorCanvasPreview";
import { BasicEditorLayers } from "./basicEditorLayers";
import { BasicEditorProperties } from "./basicEditorProperties";

import { GIXEditorWorkspace } from "./gixEditorWorkspace";
import { GIXEditorProperties } from "./gixEditorProperties";

let statusBarStaticLatLng: vscode.StatusBarItem;
let statusBarHoverLatLng: vscode.StatusBarItem;
let statusBarZoomLevel: vscode.StatusBarItem;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * Provide UI editor with Leaflet.
 * Provide Feature Collection or Layer Group Navigator.
 * Provide Properties and Geometry editor panel.
 * Provide helper functionality to
 * 	- "minify" geojson
 *  - transform shapfile data to geojson
 *  - mix/merge property key/values
 *  - Find/replace all on property key's
 *
 *
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  // const document = vscode.window.activeTextEditor?.document;

  // Load the custom editor resources.
  // TODO: Add context menu items (or refactor capability) to prettify and minify the document.
  context.subscriptions.push(BasicEditorCanvas.register(context));

  // Load layer preview panel.
  context.subscriptions.push(BasicEditorCanvasPreview.register(context));

  // Load the Layers related resources.
  //   context.subscriptions.push(BasicEditorLayers.register());

  // Load the properties panel.
  context.subscriptions.push(BasicEditorProperties.register(context));

  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      "my-notebook",
      new SampleSerializer()
    )
  );

  // Editor tools
  // basicEditorCanvas
  // basicEditorCanvasPreview
  // basicEditorLayers
  // basicEditorProperties

  // OpenGIX IDE
  // gixEditorWorkspace
  // gixEditorCanvas
  // gixEditorCanvasPreview
  // gixEditorLayers
  // gixEditorProperties

  // Load OpenGIX IDE Workspace panel.
  context.subscriptions.push(GIXEditorProperties.register(context));

  // Load OpenGIX IDE Properties panel.
  context.subscriptions.push(GIXEditorWorkspace.register());

  // Observe editor changes and update context. listeners.
  vscode.window.onDidChangeActiveTextEditor(updateActiveDocumentContent);

  // Use this to redraw the map from a document
  vscode.window.onDidChangeVisibleTextEditors((e) => console.log(e));

  // vscode.window.onDidChangeWindowState(e => console.log(e));
  // vscode.window.onDidChangeTextEditorSelection(e => console.log(e));

  // Init. context for listerns.
  updateActiveDocumentContent();

  //   // Status bar
  //   context.subscriptions.push(
  //     vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 300),
  //     vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 301),
  //     vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 303)
  //   );
  //   StatusBar.updateLatLngStaticBarItem();
  //   StatusBar.updateLatLngsHoverStatusBarItem();
  //   StatusBar.updateZoomLevelStatusBarItem(3);

  // Status bar
  statusBarStaticLatLng = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    300
  );
  context.subscriptions.push(statusBarStaticLatLng);
  StatusBar.updateLatLngStaticBarItem();

  statusBarHoverLatLng = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    301
  );
  context.subscriptions.push(statusBarHoverLatLng);
  StatusBar.updateLatLngsHoverStatusBarItem();

  statusBarZoomLevel = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    303
  );
  context.subscriptions.push(statusBarZoomLevel);
  StatusBar.updateZoomLevelStatusBarItem(3);

  // Dialog style modal example.
  vscode.window.showInformationMessage("Hello World!", {
    modal: true,
    detail: "Message coppied!",
  });
}

function updateActiveDocumentContent(event?: any) {
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    // Send this content to TreeView or WebView
    // For WebView: webViewPanel.webview.postMessage({ content: documentContent });
    // For TreeView: update your TreeDataProvider
    // context.subscriptions.push(LayersExplorer.register());
  }
}

/**
 *
 */
export class StatusBar {
  public static updateLatLngStaticBarItem(content?: string): void {
    if (content) {
      statusBarStaticLatLng.tooltip = `Copy Pin Coordinates`;
      // TODO: See Clipboard https://code.visualstudio.com/api/references/vscode-api#Clipboard
      statusBarStaticLatLng.command = "Copy command coming soon";
      statusBarStaticLatLng.text = `$(copy) ${content}`;
      // if (typeof vscode.window.activeTextEditor === 'undefined') {
      statusBarStaticLatLng.show();
      // }
    }
  }

  public static updateLatLngsHoverStatusBarItem(content?: string): void {
    if (content) {
      statusBarHoverLatLng.tooltip = `Latitute, Longitude`;
      statusBarHoverLatLng.text = `${content}`;
      statusBarHoverLatLng.show();
    }
  }

  public static updateZoomLevelStatusBarItem(content: number): void {
    statusBarZoomLevel.tooltip = `Zoom Level`;
    statusBarZoomLevel.text = `$(zoom-in) ${content}`;
    statusBarZoomLevel.show();
  }
}

/**
 * Shows a pick list using window.showQuickPick().
 */
export async function showQuickPick() {
  let i = 0;
  const result = await vscode.window.showQuickPick(["eins", "zwei", "drei"], {
    placeHolder: "eins, zwei or drei",
    onDidSelectItem: (item) =>
      vscode.window.showInformationMessage(`Focus ${++i}: ${item}`),
  });
  vscode.window.showInformationMessage(`Got: ${result}`);
}

interface RawNotebook {
  cells: RawNotebookCell[];
}

interface RawNotebookCell {
  source: string[];
  cell_type: "code" | "markdown";
}

class SampleSerializer implements vscode.NotebookSerializer {
  async deserializeNotebook(
    content: Uint8Array,
    _token: vscode.CancellationToken
  ): Promise<vscode.NotebookData> {
    var contents = new TextDecoder().decode(content);

    console.log(contents);

    let raw: RawNotebookCell[];
    try {
      raw = (<RawNotebook>JSON.parse(contents)).cells;
    } catch {
      raw = [];
    }

    const cells = raw.map(
      (item) =>
        new vscode.NotebookCellData(
          item.cell_type === "code"
            ? vscode.NotebookCellKind.Code
            : vscode.NotebookCellKind.Markup,
          item.source.join("\n"),
          item.cell_type === "code" ? "python" : "markdown"
        )
    );

    return new vscode.NotebookData(cells);
  }

  async serializeNotebook(
    data: vscode.NotebookData,
    _token: vscode.CancellationToken
  ): Promise<Uint8Array> {
    let contents: RawNotebookCell[] = [];

    for (const cell of data.cells) {
      contents.push({
        cell_type:
          cell.kind === vscode.NotebookCellKind.Code ? "code" : "markdown",
        source: cell.value.split(/\r?\n/g),
      });
    }

    return new TextEncoder().encode(JSON.stringify(contents));
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
