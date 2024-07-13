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
    <div className="text-red-400 mt-2">
      <pre>{text}</pre>
    </div>
  );
}