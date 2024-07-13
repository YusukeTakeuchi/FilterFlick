import * as vscode from 'vscode';

export function setAllContent(document: vscode.TextDocument, content: string): Thenable<boolean> {
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );
  edit.replace(document.uri, fullRange, content);
  return vscode.workspace.applyEdit(edit);
}