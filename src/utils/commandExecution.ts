import * as vscode from 'vscode';
import * as child_process from 'child_process';

type FilterResultValue = {
  stdout: string,
  stderr: string,
  statusCode: number | null,
};

type ProgressResult<T> = {
  result: 'exit',
  value: T,
} | {
  result: 'cancel',
};

/*
  * Execute the given shell command with the given content as input.
  * Returns a promise that resolves with the output of the command.
  * Shows a progress notification while the command is running.
  * If the user cancels the operation, the promise resolves with 'cancel'.
  */
export async function filterWithShellCommand(command: string, content: string): Promise<ProgressResult<FilterResultValue>> {
  const commandPromise = new Promise<FilterResultValue>((resolve) => {
    let stdoutResult = '';
    let stderrResult = '';
    const child = child_process.spawn(command, { shell: true });
    child.stdout.on('data', (data) => {
      stdoutResult += data;
    });
    child.stderr.on('data', (data) => {
      stderrResult += data;
    });
    child.on('close', (code) => {
      resolve({
        stdout: stdoutResult,
        stderr: stderrResult,
        statusCode: code,
      });
    });
    child.stdin.write(content);
    child.stdin.end();
  });

  const title = `Executing the filter command: ${command}`;
  return await showVscodeProgressWithDelay(commandPromise, title, 500);
}

function showVscodeProgressWithDelay<T>(promise: Thenable<T>, title: string, delayMs: number): Promise<ProgressResult<T>> {
  let finished = false;
  const resultThenable =
    promise.then((result) => {
      finished = true;
      return {
        result: 'exit' as const,
        value: result,
      };
    });
  const progressThenable = new Promise<ProgressResult<T>>((resolve) => {
    setTimeout(() => {
      if (!finished) {
        resolve(
          vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: title,
            cancellable: true,
          }, (_progress, token) => {
            return new Promise((resolveProgress) => {
              token.onCancellationRequested(() => {
                resolveProgress({ result: 'cancel' });
              });
              resultThenable.then(resolveProgress);
            });
          })
        );
      }
    }, delayMs);
  });
  return Promise.race<ProgressResult<T>>([resultThenable, progressThenable]);
}