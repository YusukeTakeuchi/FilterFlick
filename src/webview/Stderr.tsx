import React from 'react';
import './App.css';

type StderrProps = {
  text: string,
};

export function Stderr({ text }: StderrProps) {
  if (!text) {
    return null;
  }

  return (
    <div className="text-red-400 w-full overflow-x-auto">
      <pre>{text}</pre>
    </div>
  );
}