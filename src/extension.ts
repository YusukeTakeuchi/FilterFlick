import * as vscode from 'vscode';
import * as path from 'path';
import { setAllContent } from './utils/edit';
import { execSync } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('filterFlickSidebarView', new FilterFlickSidebarProvider(context.extensionPath))
  );
}

class FilterFlickSidebarProvider implements vscode.WebviewViewProvider {
  private readonly extensionPath: string;

  private readonly outputDocumentUris: Map<string, string> = new Map();

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(this.extensionPath, 'dist'))]
    };

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'filter':
            this.applyFilter(message.text);
            return;
        }
      }
    );
  }

  private getWebviewScriptUri(webview: vscode.Webview): vscode.Uri {
    return webview.asWebviewUri(
      vscode.Uri.file(path.join(this.extensionPath, 'dist', 'webview.js'))
    );
  }

  private getWebviewContent(webview: vscode.Webview): string {
    const scriptUri = this.getWebviewScriptUri(webview);
    console.log(scriptUri);
    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Command Input</title>
        <script src="${scriptUri.toString()}"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
      </html>
    `;

    return content;
  }

  private async applyFilter(command: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const text = document.getText();

    const filteredText = this.filterWithShellCommand(command, text);

    let outputDocument = this.getExistingOutputDocument(document);

    if (outputDocument) {
      setAllContent(outputDocument, filteredText);
    } else {
      const newOutputDocument = await vscode.workspace.openTextDocument({ content: filteredText });
      await vscode.window.showTextDocument(newOutputDocument, {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      });
      this.updateOutputDocumentMapping(document, newOutputDocument);
    }
  }

  // get the existing output document for the document that is being filtered
  private getExistingOutputDocument(document: vscode.TextDocument): vscode.TextDocument | undefined {
    const existingUri = this.outputDocumentUris.get(document.uri.toString());
    return vscode.workspace.textDocuments.find(doc => doc.uri.toString() === existingUri);
  }

  private updateOutputDocumentMapping(document: vscode.TextDocument, filterOutputDocument: vscode.TextDocument) {
    this.outputDocumentUris.set(document.uri.toString(), filterOutputDocument.uri.toString());
  }

  private filterWithShellCommand(command: string, content: string) {
    return execSync(command, { input: content }).toString();
  }
}

export function deactivate() {}
