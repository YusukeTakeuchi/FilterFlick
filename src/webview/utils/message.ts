import { WebviewMessage } from "../../webviewInterop/webviewMessage";
import { vscode } from "./vscode";

export function sendMessageToExtension(message: WebviewMessage) {
  vscode.postMessage(message);
}