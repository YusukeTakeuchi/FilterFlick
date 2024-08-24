import * as vscode from 'vscode';

const SCHEMA_OUTPUT = "filterflick-output";

class OutputDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private readonly getText: (uri: vscode.Uri) => string;
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  constructor({ getText }: { getText: (uri: vscode.Uri) => string }) {
    this.getText = getText;
  }

  dispose() {
    this._onDidChange.dispose();
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.getText(uri);
  }

  documentChanged(uri: vscode.Uri) {
    this._onDidChange.fire(uri);
  }

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }
}

export class OutputDocumentManager {
  private readonly outputDocumentUris: Map<string, string> = new Map();

  // map the uri of a document to the text of the output document
  private readonly outputTexts: Map<string, string> = new Map();
  private readonly outputDocumentContentProvider: OutputDocumentContentProvider;

  constructor() {
    this.outputDocumentUris = new Map();
    this.outputTexts = new Map();
    this.outputDocumentContentProvider = new OutputDocumentContentProvider({
      getText: (uri: vscode.Uri) => {
        return this.outputTexts.get(uri.path) || "";
      },
    });

    vscode.workspace.registerTextDocumentContentProvider(SCHEMA_OUTPUT, this.outputDocumentContentProvider);
  }

  async showOutputText(document: vscode.TextDocument, outputText: string, showingDiff: boolean) {
    let outputDocument = this.getExistingOutputDocument(document);

    this.outputTexts.set(document.uri.toString(), outputText);
    if (!outputDocument) {
      outputDocument = await vscode.workspace.openTextDocument(this.uriOfOutputDocumentFor(document));
    } else {
      this.outputDocumentContentProvider.documentChanged(this.uriOfOutputDocumentFor(document));
    }

    if (showingDiff) {
      await this.closeTextTab(outputDocument);
      await vscode.commands.executeCommand(
        "vscode.diff",
        document.uri,
        outputDocument.uri,
        "FilterFlick diff",
      );
      vscode.commands.executeCommand("workbench.action.focusFirstSideEditor");
    } else {
      // close the diff view if it is shown
      if (this.isDiffViewShown(document, outputDocument)) {
        const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
        vscode.window.tabGroups.close(activeTab!);
      }
      await vscode.window.showTextDocument(outputDocument, {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      });
    }
  }

  // get the existing output document for the document that is being filtered
  private getExistingOutputDocument(document: vscode.TextDocument): vscode.TextDocument | undefined {
    const uri = this.uriOfOutputDocumentFor(document);
    return vscode.workspace.textDocuments.find(
      doc => doc.uri.toString() === uri.toString()
    );
  }

  private async closeTextTab(document: vscode.TextDocument) {
    const tabs = vscode.window.tabGroups.all.flatMap(tabGroup => tabGroup.tabs);
    for (const tab of tabs) {
      if (tab.input instanceof vscode.TabInputText) {
        if (document.uri.toString() === tab.input.uri.toString()) {
          await vscode.window.tabGroups.close(tab);
        }
      }
    }
  }

  private isDiffViewShown(originalDocument: vscode.TextDocument, outputDocument: vscode.TextDocument): boolean {
    const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (!tab) {
      return false;
    }
    return (
      tab.input instanceof vscode.TabInputTextDiff &&
      tab.input.original.toString() === originalDocument.uri.toString() &&
      tab.input.modified.toString() === outputDocument.uri.toString()
    );
  }

  private uriOfOutputDocumentFor(document: vscode.TextDocument): vscode.Uri {
    return vscode.Uri.from({
      scheme: SCHEMA_OUTPUT,
      path: document.uri.toString(),
    });
  }
}