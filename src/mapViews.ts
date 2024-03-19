import * as vscode from 'vscode';
import { getNonce } from './utilities/getNonce';

export class MapView {
    public static full() {

    }

    /**
	 * Get the static html used for the editor webviews.
     * 
     * @param webview 
     * @param context 
     * @returns 
     */
    public static mini(webview: vscode.Webview, context: vscode.ExtensionContext): string {
		// Local path to script and css for the webview
		const styleCanvasUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'canvas.css'));	
		const styleLeafletUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'leaflet.css'));	
		const scriptLeafletUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'leaflet.js'));
		const scriptGeoJSONUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'geojson.js'));

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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src * data: https:; style-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
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
                        const vscode = acquireVsCodeApi();

						// Listen for mouseover events to display 
						// coords in IDE statusbar
                        L.CursorHandler = L.Handler.extend({

                            addHooks: function () {
                                this._map.on('mousemove', this._update, this);
                            },

                            removeHooks: function () {
                                this._map.off('mousemove', this._update, this);
                            },

                            _update: function (e) {
                                vscode.postMessage({
                                    command: 'hoverPointerCoordinates',
                                    feature: GeoJSON.parse(e.latlng, { Point: ['lat', 'lng'] })
                                })
                            }
                        });

                        L.Map.addInitHook('addHandler', 'cursor', L.CursorHandler);

						// Script run within the webview itself.
						var map = L.map('map', {
							center: [40.18, -96.59],
							zoom: 3,
                            cursor: true,
							zoomControl: false,
							attributionControl: false, // Only set due to space constraints
							scrollWheelZoom: false
						});
						
						var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
							attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
							subdomains: 'abcd',
							maxZoom: 20
						}).addTo(map);

						// Instantiate control for overlays
						var layerControl = L.control.layers();

						// Grab LatLng from cursor click
						map.on('click', function(e) {
                            vscode.postMessage({
                                command: 'pinPointerCoordinates',
                                feature: GeoJSON.parse(e.latlng, { Point: ['lat', 'lng'] })
                            })
						});
				
						// Handle the message inside the webview
						window.addEventListener('message', event => {
								const geojson = JSON.parse(event.data); // The JSON data our extension sent
								
								var features = L.geoJSON(geojson, {
									style: function (feature) {
										return {color: 'teal', weight: .75};
									}
								}).addTo(map);
								
								// TODO: insert pan/zoom transition in selected state
								map.fitBounds(features.getBounds());
						});
					}())
				</script>
			</body>
			</html>`;
    }
}