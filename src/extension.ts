import * as vscode from 'vscode';
import * as path from 'path';
import { setAllContent } from './lib/utils/edit';
import { filterWithShellCommand } from './lib/utils/commandExecution';
import { setupWebview } from './lib/setupWebview';
import { OutputDocumentManager } from './lib/OutputDocumentManager';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('filterFlickSidebarView', new FilterFlickSidebarProvider(context.extensionPath))
  );
}

class FilterFlickSidebarProvider implements vscode.WebviewViewProvider {
  private readonly extensionPath: string;

  private readonly outputDocumentManager = new OutputDocumentManager();

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
    const filterResult = await filterWithShellCommand(command, document.getText());

    if (filterResult.result === 'cancel') {
      return;
    }

    this.outputDocumentManager.showOutputText(document, filterResult.value.stdout);
  }
}

export function deactivate() {}
