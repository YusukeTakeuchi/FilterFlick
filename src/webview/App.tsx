import React, { ChangeEvent, FormEventHandler } from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import './App.css';

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
    <form onSubmit={handleSubmit} className="w-full">
      <VSCodeTextField type="text" placeholder="Enter filter command" value={command} onInput={handleCommandChange} className="w-full"/>
      <VSCodeButton type="submit" className="w-full">Execute</VSCodeButton>
    </form>
  );
}

function applyFilter(event: React.FormEvent, command: string) {
  event.preventDefault();
  vscode.postMessage({ command: 'filter', text: command });
}