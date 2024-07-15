import * as vscode from 'vscode';
import { filterWithShellCommand } from './lib/utils/commandExecution';
import { setupWebview } from './lib/setupWebview';
import { OutputDocumentManager } from './lib/OutputDocumentManager';
import { WebviewSyncState } from './webviewInterop/webviewMessage';
import { sendMessageToExtension } from './webview/utils/message';
import { sendMessageToWebview } from './lib/utils/message';

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

      webviewProvider.execute(command);
    })
  );
}

class FilterFlickSidebarProvider implements vscode.WebviewViewProvider {
  private webview?: vscode.Webview;

  private webviewState?: WebviewSyncState;

  // If set, the command will be executed when the webview is ready
  // This is used when the command is passed as an argument to the `filterFlick.execute` command and the webview is not yet ready
  private predesignatedCommand?: string;

  private readonly extensionPath: string;

  private readonly outputDocumentManager = new OutputDocumentManager();

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.webview = webviewView.webview;
    setupWebview(webviewView.webview, {
      extensionPath: this.extensionPath,
      applyFilter: this.applyFilter.bind(this),
      onReady: this.webviewReady.bind(this),
      onSyncState: this.syncState.bind(this),
    });
  }

  /*
   * Execute the given shell command in the webview
   */
  async execute(command: string) {
    if (!this.webview) {
      this.predesignatedCommand = command;
      await vscode.commands.executeCommand('filterFlickSidebarView.focus');
      return;
    }
    await vscode.commands.executeCommand('filterFlickSidebarView.focus');
    sendMessageToWebview(this.webview, { command: 'setCommandText', text: command });
    await this.applyFilter();
  }

  private webviewReady() {
    if (this.predesignatedCommand) {
      this.execute(this.predesignatedCommand);
    }
  }

  private syncState(state: WebviewSyncState) {
    this.webviewState = state;
  }

  private async applyFilter() {
    if (!this.webview || !this.webviewState) {
      return;
    }

    const v = vscode;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const filterResult = await filterWithShellCommand(this.webviewState.command, document.getText());

    if (filterResult.result === 'cancel') {
      return;
    }

    this.outputDocumentManager.showOutputText(document, filterResult.value.stdout, this.webviewState.showDiff);
    sendMessageToWebview(this.webview, { command: 'setStderr', text: filterResult.value.stderr });
  }
}

export function deactivate() {}
