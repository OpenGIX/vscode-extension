import * as vscode from "vscode";
import { MapView } from "./mapViews";
import { StatusBar } from "./extension";

/**
 * 
 */
export class BasicEditorCanvasPreview implements vscode.WebviewViewProvider {
 

	// Glabal name of view
	private static readonly viewType = 'panel.BasicEditorCanvasPreview';

    /**
     * 
     * @param extensionUri 
     * @returns 
     */
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerWebviewViewProvider(this.viewType, new BasicEditorCanvasPreview(context));
    }

    /**
     * 
     * @param context 
     */
	constructor(private readonly context: vscode.ExtensionContext) { 

    }


    /**
     * 
     * @param webviewView 
     * @param context 
     * @param token 
     */
    public resolveWebviewView(panel: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
		panel.webview.html = MapView.mini(panel.webview, this.context);

		// Setup initial content for the webview
		panel.webview.options = {
			// Allow scripts in the webview
			enableScripts: true
		};

        vscode.window.onDidChangeTextEditorSelection((event) => {
            const editor = event.textEditor;
            const selection = editor.document.lineAt(editor.selection.active.line);
            panel.webview.postMessage(selection.text.trim().replace(/,$/, ""));
        });

		// Send document to page
		panel.webview.postMessage(vscode.window.activeTextEditor?.document.getText());
		
		// Listen for canvas input
		panel.webview.onDidReceiveMessage((message) => {
			// Float to two decimal places and convert to string
			const coords = message.feature.geometry.coordinates.map((coord: number) => coord.toFixed(2)).join(', ');

			switch (message.command) {
				case 'pinPointerCoordinates':
					StatusBar.updateLatLngStaticBarItem(coords);
					break;
				case 'hoverPointerCoordinates': 
					StatusBar.updateLatLngsHoverStatusBarItem(coords);
					break;
			}
		},
		undefined,
		this.context.subscriptions);
    }
}