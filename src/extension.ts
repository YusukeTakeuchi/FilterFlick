import * as vscode from 'vscode';
import * as path from 'path';
import { setAllContent } from './lib/utils/edit';
import { filterWithShellCommand } from './lib/utils/commandExecution';
import { setupWebview } from './lib/setupWebview';

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
    setupWebview(webviewView.webview, {
      extensionPath: this.extensionPath,
      applyFilter: this.applyFilter.bind(this),
    });
  }

  private async applyFilter(command: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const text = document.getText();

    const filterResult = await filterWithShellCommand(command, text);

    if (filterResult.result === 'cancel') {
      return;
    }
    const filteredText = filterResult.value.stdout;

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
}

export function deactivate() {}
