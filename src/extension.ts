import * as vscode from 'vscode';
import { filterWithShellCommand } from './lib/utils/commandExecution';
import { setupWebview } from './lib/setupWebview';
import { OutputDocumentManager } from './lib/OutputDocumentManager';

export function activate(context: vscode.ExtensionContext) {
  const webviewProvider = new FilterFlickSidebarProvider(context.extensionPath);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('filterFlickSidebarView', webviewProvider));
  context.subscriptions.push(
    vscode.commands.registerCommand('filterFlick.execute', async (argCommand) => {
      let command = argCommand ?? await vscode.window.showInputBox({ prompt: 'Enter a shell command to filter the text' });
      command = command?.trim();

      if (!command) {
        return;
      }

      // show the webview and execute the command
      await vscode.commands.executeCommand('filterFlickSidebarView.focus');
      webviewProvider.execute(command);
    })
  );
}

class FilterFlickSidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.Webview;

  private readonly extensionPath: string;

  private readonly outputDocumentManager = new OutputDocumentManager();

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView.webview;
    setupWebview(webviewView.webview, {
      extensionPath: this.extensionPath,
      applyFilter: this.applyFilter.bind(this),
    });
  }

  async execute(command: string) {
    if (!this.view) {
      return;
    }
    this.view.postMessage({ command: 'setCommandText', text: command });
    await this.applyFilter(command);
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
    this.view?.postMessage({ command: 'setStderr', text: filterResult.value.stderr });
  }
}

export function deactivate() {}
