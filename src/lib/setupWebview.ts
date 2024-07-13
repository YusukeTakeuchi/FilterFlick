import * as vscode from 'vscode';
import * as path from 'path';

type SetupWebviewOptions = {
  extensionPath: string,
  applyFilter: (text: string) => void,
};

export function setupWebview( webview: vscode.Webview, options: SetupWebviewOptions): void {
  webview.options = {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.file(path.join(options.extensionPath, 'dist'))]
  };

  webview.html = getWebviewContent(getWebviewScriptUri(webview, options.extensionPath));

  webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'filter':
          options.applyFilter(message.text);
          return;
      }
    }
  );
}

function getWebviewScriptUri(webview: vscode.Webview, extensionPath: string): string {
  return webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, 'dist', 'webview.js'))
  ).toString();
}

function getWebviewContent(scriptUri: string): string {
  const content = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Command Input</title>
      <script src="${scriptUri}"></script>
    </head>
    <body>
      <div id="root"></div>
    </body>
    </html>
  `;

  return content;
}