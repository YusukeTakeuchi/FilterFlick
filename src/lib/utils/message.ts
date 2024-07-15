import * as vscode from 'vscode';
import { ExtensionMessage } from '../../webviewInterop/extensionMessage';

/*
 * send message to webview
 */ 
export function sendMessageToWebview(webview: vscode.Webview, message: ExtensionMessage) {
  webview.postMessage(message);
}