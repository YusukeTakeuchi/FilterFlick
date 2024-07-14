import { useState } from 'react';

type HistoryState = {
  history: string[];
  historyIndex: number;
};

export function useCommandHistory(maxHistorySize: number = 50) {
  const [historyState, setHistoryState] = useState<HistoryState>({
    history: [],
    historyIndex: -1,
  });

  const addCommandToHistory = (command: string) => {
    setHistoryState(({history, historyIndex}) => {
      if (history.length === 0 || history[history.length - 1] !== command) {
        const newHistory = [...history, command].slice(-maxHistorySize);
        return { history: newHistory, historyIndex: newHistory.length - 1 };
      } else {
        return { history, historyIndex };
      }
    });
  };

  const handleArrowUp = () => {
    setHistoryState(({history, historyIndex}) => {
      const newHistoryIndex = historyIndex > 0 ? historyIndex - 1 : historyIndex;
      return { history, historyIndex: newHistoryIndex };
    });
  };

  const handleArrowDown = () => {
    setHistoryState(({history, historyIndex}) => {
      const newHistoryIndex =
        historyIndex !== -1 && historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
      return { history, historyIndex: newHistoryIndex };
    });
  };


  const getCommandFromHistory = (): string | undefined => {
    const { history, historyIndex } = historyState;
    return history[historyIndex];
  };

  return {
    addCommandToHistory,
    handleArrowUp,
    handleArrowDown,
    getCommandFromHistory,
  };
}