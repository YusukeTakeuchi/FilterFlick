import React, { ChangeEvent, FormEventHandler } from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

const vscode = acquireVsCodeApi();

export function App() {
  const [command, setCommand] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    applyFilter(event, command);
  };

  const handleCommandChange = (e: any) => {
    setCommand(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VSCodeTextField type="text" placeholder="Enter filter command" value={command} onInput={handleCommandChange} />
      <VSCodeButton type="submit">Execute</VSCodeButton>
    </form>
  );
}

function applyFilter(event: React.FormEvent, command: string) {
  event.preventDefault();
  vscode.postMessage({ command: 'filter', text: command });
}