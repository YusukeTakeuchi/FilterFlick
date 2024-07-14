import { useCallback, useEffect, useState } from 'react';

type HistoryState = {
  history: string[];
  historyIndex: number;
  willSetCommandFromHistory: boolean;
};

type useCommandHistoryOptions = {
  setCommand: (command: string) => void;
  maxHistorySize?: number;
};

export function useCommandHistory({ setCommand, maxHistorySize = 50 }: useCommandHistoryOptions) {
  const [historyState, setHistoryState] = useState<HistoryState>({
    history: [],
    // -1 means no history exists
    // history.length means new command is being typed
    historyIndex: -1,
    willSetCommandFromHistory: false,
  });

  const addCommandToHistory =
    useCallback((command: string) => {
      setHistoryState(({history, historyIndex, willSetCommandFromHistory}) => {
        if (history.length === 0 || history[history.length - 1] !== command) {
          const newHistory = [...history, command].slice(-maxHistorySize);
          return { history: newHistory, historyIndex: newHistory.length - 1, willSetCommandFromHistory: true };
        } else {
          return { history, historyIndex, willSetCommandFromHistory };
        }
      });
    }, [maxHistorySize]);

  const handleArrowUp =
    useCallback(() => {
      setHistoryState(({history, historyIndex, willSetCommandFromHistory}) => {
        //const newHistoryIndex = historyIndex > 0 ? historyIndex - 1 : historyIndex;
        if (historyIndex > 0) {
          return { history, historyIndex: historyIndex - 1, willSetCommandFromHistory: true };
        } else {
          return { history, historyIndex, willSetCommandFromHistory };
        }
      });
    }, []);

  const handleArrowDown =
    useCallback(() => {
      setHistoryState(({history, historyIndex, willSetCommandFromHistory}) => {
        if (-1 < historyIndex && historyIndex < history.length) {
          // newHistoryIndex === history.length is ok because it means new command is being typed
          return { history, historyIndex: historyIndex + 1, willSetCommandFromHistory: true };
        } else {
          return { history, historyIndex, willSetCommandFromHistory };
        }
      });
    }, []);


  const getCommandFromHistory = (): string => {
    const { history, historyIndex } = historyState;
    return history[historyIndex] ?? '';
  };

  useEffect(() => {
    if (historyState.willSetCommandFromHistory) {
      setCommand(getCommandFromHistory());
      setHistoryState(({history, historyIndex}) => ({ history, historyIndex, willSetCommandFromHistory: false }));
    }
  }, [historyState.willSetCommandFromHistory]);

  return {
    addCommandToHistory,
    handleArrowUp,
    handleArrowDown,
    getCommandFromHistory,
  };
}