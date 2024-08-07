import React, { useEffect } from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import './App.css';
import { Stderr } from './Stderr';

const vscode = acquireVsCodeApi();

type Command = {
  command: "setCommandText",
  text: string,
} | {
  command: "setStderr",
  text: string,
};

export function App() {
  const [initialized, setInitialized] = React.useState(false);

  const [command, setCommand] = React.useState('');

  const [stderr, setStderr] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    applyFilter(event, command);
  };

  const handleCommandChange = (e: any) => {
    setCommand(e.target.value);
  };

  useEffect(() => {
    const listener = (event: MessageEvent<Command>) => {
      const message = event.data;
      switch(message.command) {
        case 'setCommandText':
          setCommand(message.text);
          break;
        case "setStderr":
          setStderr(message.text);
          break;
        default:
          throw new Error('Unknown command');
      }
    };
    addEventListener('message', listener);
    if (!initialized) {
      vscode.postMessage({ command: 'ready' });
      setInitialized(true);
    }
    return () => removeEventListener('message', listener);
  }, []);

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full">
        <VSCodeTextField type="text" placeholder="Enter filter command" value={command} onInput={handleCommandChange} className="w-full"/>
        <VSCodeButton type="submit" className="w-full">Execute</VSCodeButton>
      </form>
      <Stderr text={stderr} />
    </>
  );
}

function applyFilter(event: React.FormEvent, command: string) {
  event.preventDefault();
  vscode.postMessage({ command: 'filter', text: command });
}