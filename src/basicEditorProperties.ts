/**
 *
 */

import * as vscode from "vscode";
// import * as json from './utilities/json';
import {
  getLanguageService,
  SchemaRequestService,
  TextDocument,
} from "vscode-json-languageservice";
// import { JSONPath } from 'jsonpath-plus';
import { getNonce } from "./utilities/getNonce";
import { getUri } from "./utilities/getUri";

/**
 * This class manages the state and behavior of PropertiesExplorerPanel webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering EditableDataGrid webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 */
export class BasicEditorProperties implements vscode.WebviewViewProvider {
  public static readonly viewType = "panel.BasicEditorProperties";

  /**
   *
   * @param context
   * @returns
   */
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.registerCommand(
      "panel.BasicEditorProperties.AddProperty",
      async () => {
        const property = await vscode.window.showInputBox({
          title: "New Property",
          placeHolder: "New property name...",
          // validateInput: text => {
          //     return text === '123' ? 'Input must be a JSON compatible string.' : null;
          // }
        });

        // TODO: why isn't this passing. Check logic operators `property` output.
        if (property !== "undefined") {
          vscode.window.showInformationMessage(
            `New property created: ${property}`
          );
        }
      }
    );

    return vscode.window.registerWebviewViewProvider(
      this.viewType,
      new BasicEditorProperties(context)
    );
  }

  /**
   *
   * @param context
   */
  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   *
   */
  public static async addProperty() {
    const input = vscode.window.createQuickPick();

    input.title = "New Property";
    input.placeholder = "New property name...";

    const property = await vscode.window.showInputBox({
      validateInput: (text) => {
        vscode.window.showInformationMessage(`Validating: ${text}`);
        return text === "123" ? "Not 123!" : null;
      },
    });
    vscode.window.showInformationMessage(`Property ${property} created.`);

    input.onDidHide(() => input.dispose());
    input.show();
  }

  /**
   *
   * @param webviewView
   * @param context
   * @param token
   */
  public resolveWebviewView(
    panel: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    // 1. Validate document is properly formatted
    // 2. Parse document for meaningful startup clues like FeatrureCollection name's or CRS
    // properties or, Properties on a Featue.
    // 2.1.
    panel.webview.html = this.getEditableDataGridMarkup(panel.webview);

    panel.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      // Restrict the webview to only load resources from the `dist` directory
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    vscode.window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      let selection = editor.document
        .lineAt(editor.selection.active.line)
        .text.trim()
        .replace(/,$/, "");

      /**
       * TODO: Can we use the built in language service to parse
       * and autocorrect syntax errors?
       */
      const jsonContentUri = "foo://server/example.data.json";
      const jsonContent = `{
               "name": 12
               "country": "Ireland"
            }`;
      const jsonSchemaUri = "https://geojson.org/schema/GeoJSON.json";
      const jsonSchema = {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          country: {
            type: "string",
            enum: ["Ireland", "Iceland"],
          },
        },
      };

      const textDocument = TextDocument.create(
        "https://geojson.org/schema/GeoJSON.json",
        "json",
        1,
        selection
      );

      const jsonLanguageService = getLanguageService({
        schemaRequestService: (uri) => {
          if (uri === jsonSchemaUri) {
            return Promise.resolve(JSON.stringify(jsonSchema));
          }
          return Promise.reject(`Unabled to load schema at ${uri}`);
        },
      });
      // associate `*.data.json` with the `foo://server/data.schema.json` schema
      jsonLanguageService.configure({
        allowComments: false,
        schemas: [{ fileMatch: ["*.json"], uri: jsonSchemaUri }],
      });

      //     const jsonDocument = jsonLanguageService.parseJSONDocument(textDocument);
      // console.log(jsonDocument);
      // const diagnostics = await jsonLanguageService.doValidation(textDocument, jsonDocument);
      // console.log('Validation results:', diagnostics.map(d => `[line ${d.range.start.line}] ${d.message}`));

      // /*
      //  * > Validation results: [
      //  * >    '[line 1] Incorrect type. Expected "string".',
      //  * >    '[line 2] Expected comma'
      //  * > ]
      //  */

      // const competionResult = await jsonLanguageService.doComplete(textDocument, { line: 2, character: 18 }, jsonDocument);
      // console.log('Completion proposals:', competionResult?.items.map(i => `${i.label}`));

      /*
       * Completion proposals: [ '"Ireland"', '"Iceland"' ]
       */

      // const document = JSON.parse(selection);
      // console.log(jsonpath.document);

      // const properties = JSONPath({json: document, path: '$..properties'});
      // console.log(properties);
      // console.log(jp.query(JSON.parse(selection), '$..properties'));
      // const _selection = json.parse(selection.text);
      // TODO: Implement service to validate JSON and suggest
      //   I'm looking for a way to programmatically validate a JSON object against a schema that would identify syntax anomalies in order to attempt an auto-correct. Consider the following invalid syntax which should produce 3 errors like Multiple values require a structure. and Multipe JSON root elements:
      //   "crs":{
      //     "type":"name",
      //     "properties":{
      //     "name":"urn:ogc:def:crs:OGC:1.3:CRS84"
      //    }
      //   }

      // Evaluating the invalid responses the appropriate auto-correction would add the outer braces to produce a valid object:
      // {
      //    "crs":{
      //       "type":"name",
      //       "properties":{
      //          "name":"urn:ogc:def:crs:OGC:1.3:CRS84"
      //       }
      //    }
      // }
      // https://github.com/Microsoft/vscode-json-languageservice
      // Trim whitespace and remove the trailing comma if present.
      panel.webview.postMessage(selection);
    });

    let editor = vscode.window.activeTextEditor;

    // Use the currently selected line to update panel contexts
    let selection = editor?.document.lineAt(editor.selection.active.line);

    // Sanitize input but trimming whitespace and correcting
    // JSON syntax errors in prettified documents and
    // send document to page
    panel.webview.postMessage(selection?.text.trim().replace(/,$/, ""));

    panel.webview.onDidReceiveMessage((data) => {
      // console.log(data);
    });
  }

  /**
   *
   * @param webview
   * @returns
   */
  private getEditableDataGridMarkup(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    // const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'editableTableGrid.js'));
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "editableTableGrid.js"
      )
    );
    const styleSheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "style.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src *; style-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleSheetUri}" rel="stylesheet" />
				<title>Properties</title>
			</head>
			<body>
                <vscode-data-grid id="properties-editor" generate-header="sticky" grid-template-columns="1fr 2fr"></vscode-data-grid>
				<script nonce="${nonce}" src="${scriptUri}"></script>
                <script nonce="${nonce}">
					(function() {
                        // const vscode = acquireVsCodeApi();
					}())
                </script>
			</body>
			</html>`;
  }
}
