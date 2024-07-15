
/*
 * The message that the extension sends to the webview.
 */
export type ExtensionMessage = {
  command: "setCommandText";
  text: string;
} | {
  command: "setStderr";
  text: string;
};