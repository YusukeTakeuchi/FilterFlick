
export type WebviewSyncState = {
  command: string;
  showDiff: boolean;
};

/*
 * The message that the webview sends to the extension.
 */
export type WebviewMessage = {
  command: "filter"
} | {
  command: "ready"
} | {
  command: "syncState",
  state: WebviewSyncState,
};