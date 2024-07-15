import * as vscode from 'vscode';
import { setAllContent } from './utils/edit';

export class OutputDocumentManager {
  private readonly outputDocumentUris: Map<string, string> = new Map();

  constructor() {
    this.outputDocumentUris = new Map();
  }

  async showOutputText(document: vscode.TextDocument, outputText: string, showingDiff: boolean) {
    let outputDocument = this.getExistingOutputDocument(document);

    if (outputDocument) {
      setAllContent(outputDocument, outputText);
    } else {
      outputDocument = await vscode.workspace.openTextDocument({ content: outputText });
      this.updateMapping(document, outputDocument);
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
    const existingUri = this.outputDocumentUris.get(document.uri.toString());
    return vscode.workspace.textDocuments.find(doc => doc.uri.toString() === existingUri);
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

  private updateMapping(document: vscode.TextDocument, filterOutputDocument: vscode.TextDocument) {
    this.outputDocumentUris.set(document.uri.toString(), filterOutputDocument.uri.toString());
  }
}