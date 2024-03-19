import * as vscode from 'vscode';
import { getNonce } from './utilities/getNonce';

/**
 * Provider for GeoJSON editors.
 * 
 * GeoJSON editors are use for `.geojson` files, which are just JSON files.
 * To get started, run this extension and open an eny `.geojson` file in VS Code.
 * 
 * This provider:
 * 
 * - Sets up the initial webview for a custom editor.
 * - Loads Leaflet scripts and styles in the editor.
 * - Synchronizes changes between a text document and a custom editor.
 */
export class BasicEditorCanvas implements vscode.CustomTextEditorProvider {

	// Glabal name of view
	private static readonly viewType = 'editor.BasicEditorCanvas';

    /**
     * 
     * @param context 
     * @returns 
     */
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(BasicEditorCanvas.viewType, new BasicEditorCanvas(context));
	}

    /**
     * 
     * @param context 
     */
	constructor(private readonly context: vscode.ExtensionContext) { 

    }

	/**
	 * Called when our custom editor is opened.
	 * 
	 * 
	 */
	public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

		function updateWebview(payload: any) {
			webviewPanel.webview.postMessage(payload);
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview(this.getDocumentAsJson(document));
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'add':
					this.addNewScratch(document);
					return;

				case 'delete':
					this.deleteScratch(document, e.id);
					return;
			}
		});

		updateWebview(this.getDocumentAsJson(document));

	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
		// Local path to script and css for the webview
		const styleCanvasUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'canvas.css'));	
		const styleLeafletUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'leaflet.css'));	
		const scriptLeafletUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'leaflet.js'));
		const scriptGeoJSONUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'geojson.js'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src *; img-src *; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleCanvasUri}" rel="stylesheet" />
				<link href="${styleLeafletUri}" rel="stylesheet" />

				<title>Open GIS Editor</title>
			</head>
			<body>
				<div class="map-container">
					<div class="map-frame">
						<div id="map"></div>
					</div>
				</div>

				<script nonce="${nonce}" src="${scriptLeafletUri}"></script>
				<script nonce="${nonce}" src="${scriptGeoJSONUri}"></script>
				<script nonce="${nonce}">
					(function() {
						// Script run within the webview itself.
						var map = L.map('map', {
							center: [40.737, -73.923],
							zoom: 3,
							scrollWheelZoom: false
						});
						
						map.on('click', function(e) {
							console.log(e.latlng.lat,e.latlng.lng);
						});

						var traditional = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
							attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
							subdomains: 'abcd',
							maxZoom: 20
						});

						var light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
							attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
							subdomains: 'abcd',
							maxZoom: 20
						}).addTo(map);
						
						var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
							attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
							subdomains: 'abcd',
							maxZoom: 20
						}).addTo(map);

						var bases = { "Traditional": traditional, "Light": light, "Dark": dark };

						var layerControl = L.control.layers(bases).addTo(map);

						// Handle the message inside the webview
						window.addEventListener('message', event => {

							const geojson = event.data; // The JSON data our extension sent
							
							console.log(GeoJSON.parse(geojson, {Point: ['lat', 'lng']}));

							var features = L.geoJSON(geojson, {
								style: function (feature) {
									return {color: 'teal', weight: .75};
								}
							})
							// .bindTooltip(function (layer) {
							// 	console.log(layer);
							// 	return false;
							// 	// if (typeof layer.properties.name !== undefined) {
							// 	// 	return "<b>Name: </b>" + layer.feature.properties.name;
							// 	// }
							// })
							.addTo(map);
							
							// map.fitBounds(geoJSON.getBounds());

							layerControl.addOverlay(features, "Features").addTo(map);

							// switch (message.command) {
							// 	case 'refactor':
							// 		count = Math.ceil(count * 0.5);
							// 		counter.textContent = count;
							// 		break;
							// }
						});
					}())
				</script>
			</body>
			</html>`;
	}

	/**
	 * Add a new scratch to the current document.
	 */
	private addNewScratch(document: vscode.TextDocument) {
		const json = this.getDocumentAsJson(document);

		json.scratches = [
			...(Array.isArray(json.scratches) ? json.scratches : []),
			{
				id: getNonce(),
				text: null,
				created: Date.now(),
			}
		];

		return this.updateTextDocument(document, json);
	}

	/**
	 * Delete an existing scratch from a document.
	 */
	private deleteScratch(document: vscode.TextDocument, id: string) {
		const json = this.getDocumentAsJson(document);
		if (!Array.isArray(json.scratches)) {
			return;
		}

		json.scratches = json.scratches.filter((note: any) => note.id !== id);

		return this.updateTextDocument(document, json);
	}

	/**
	 * Try to get a current document as json text.
	 */
	private getDocumentAsJson(document: vscode.TextDocument): any {
		const text = document.getText();
		if (text.trim().length === 0) {
			return {};
		}

		try {
			return JSON.parse(text);
		} catch {
			throw new Error('Could not get document as json. Content is not valid json');
		}
	}

	/**
	 * Write out the json to a given document.
	 */
	private updateTextDocument(document: vscode.TextDocument, json: any) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(json, null, 2));

		return vscode.workspace.applyEdit(edit);
	}
}