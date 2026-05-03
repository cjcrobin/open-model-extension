import * as vscode from 'vscode';
import { ProviderManager } from './manager';

let manager: ProviderManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Open Model');
  context.subscriptions.push(output);

  manager = new ProviderManager(output);
  context.subscriptions.push(manager);

  // Register all four vendor providers once (they read config dynamically)
  manager.registerAll();
  manager.logStatus();

  // When settings change, notify Copilot that models may have changed
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('openModel')) {
        output.appendLine('\nConfiguration changed, refreshing model lists...');
        manager!.notifyAll();
        manager!.logStatus();
      }
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.reload', () => {
      output.appendLine('\nManual refresh triggered...');
      manager!.notifyAll();
      manager!.logStatus();
      vscode.window.showInformationMessage('Open Model: Model lists refreshed.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.configure', () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'openModel'
      );
    })
  );

  output.appendLine('Open Model extension activated.');
}

export function deactivate(): void {
  manager?.dispose();
  manager = undefined;
}
