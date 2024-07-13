import React, { useEffect } from 'react';
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

  useEffect(() => {
    const listener = (event: MessageEvent<{ command: string, text: string}>) => {
      const message = event.data;
      switch(message.command) {
        case 'setCommandText':
          setCommand(message.text);
          break;
        default:
          throw new Error('Unknown command');
      }
    };
    addEventListener('message', listener);
    return () => removeEventListener('message', listener);
  }, []);

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