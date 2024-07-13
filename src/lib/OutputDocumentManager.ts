import * as vscode from 'vscode';
import { setAllContent } from './utils/edit';

export class OutputDocumentManager {
  private readonly outputDocumentUris: Map<string, string> = new Map();

  constructor() {
    this.outputDocumentUris = new Map();
  }

  async showOutputText(document: vscode.TextDocument, outputText: string) {
    let outputDocument = this.getExistingOutputDocument(document);

    if (outputDocument) {
      setAllContent(outputDocument, outputText);
    } else {
      const newOutputDocument = await vscode.workspace.openTextDocument({ content: outputText });
      await vscode.window.showTextDocument(newOutputDocument, {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      });
      this.updateMapping(document, newOutputDocument);
    }
  }

  // get the existing output document for the document that is being filtered
  private getExistingOutputDocument(document: vscode.TextDocument): vscode.TextDocument | undefined {
    const existingUri = this.outputDocumentUris.get(document.uri.toString());
    return vscode.workspace.textDocuments.find(doc => doc.uri.toString() === existingUri);
  }

  private updateMapping(document: vscode.TextDocument, filterOutputDocument: vscode.TextDocument) {
    this.outputDocumentUris.set(document.uri.toString(), filterOutputDocument.uri.toString());
  }
}