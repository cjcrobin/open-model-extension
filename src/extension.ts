import * as vscode from 'vscode';
import { ProviderManager } from './manager';
import { PROVIDER_METADATA, PROVIDER_NAMES, ProviderName } from './types';
import { getFriendlyErrorMessage } from './errors';
import { UsageStore } from './storage/usageStore';
import { exportConfigCommand } from './commands/exportConfig';
import { importConfigCommand } from './commands/importConfig';
import { showUsageCommand } from './commands/showUsage';
import { createStatusBarItem, updateStatusBar } from './ui/statusBar';

let manager: ProviderManager | undefined;

async function loadApiKeys(
  secrets: vscode.SecretStorage,
  manager: ProviderManager,
  output: vscode.OutputChannel
): Promise<void> {
  for (const name of PROVIDER_NAMES) {
    const key = await secrets.get(`openModel.${name}.apiKey`);
    if (key) {
      manager.setApiKey(name, key);
      output.appendLine(
        `[${PROVIDER_METADATA[name].displayName}] API key loaded from secret storage`
      );
    }
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel('Open Model');
  context.subscriptions.push(output);

  manager = new ProviderManager(output);
  context.subscriptions.push(manager);

  const usageStore = new UsageStore(context);
  context.subscriptions.push(usageStore);
  manager.setUsageStore(usageStore);

  // Load API keys from secret storage into the manager's cache
  await loadApiKeys(context.secrets, manager, output);

  // Register all four vendor providers once (they read config dynamically)
  manager.registerAll();
  manager.logStatus();

  const statusBarItem = createStatusBarItem();
  context.subscriptions.push(statusBarItem);

  // When settings change, notify Copilot that models may have changed
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('openModel')) {
        output.appendLine('\nConfiguration changed, refreshing model lists...');
        manager!.notifyAll();
        manager!.logStatus();
        updateStatusBar(statusBarItem);
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
    vscode.commands.registerCommand('openModel.setApiKey', async () => {
      const items = PROVIDER_NAMES.map((name) => {
        const hasKey = manager!.hasApiKey(name);
        const keyStatus = hasKey ? 'API key configured' : 'No API key set';
        const enabled = vscode.workspace.getConfiguration(`openModel.${name}`).get<boolean>('enabled', false);
        const enabledStatus = enabled ? 'Enabled' : 'Disabled';

        return {
          label: PROVIDER_METADATA[name].displayName,
          description: name,
          detail: `${enabledStatus} · ${keyStatus}`,
        };
      });

      const pick = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a provider to set its API key',
        title: 'Open Model: Set API Key',
      });

      if (!pick) {
        return; // user cancelled
      }

      const providerName = pick.description as ProviderName;
      const { displayName } = PROVIDER_METADATA[providerName];

      const apiKey = await vscode.window.showInputBox({
        prompt: `Enter your ${displayName} API key`,
        placeHolder: 'sk-...',
        password: true,
        ignoreFocusOut: true,
        title: `Open Model: Set ${displayName} API Key`,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'API key cannot be empty';
          }
          return undefined;
        },
      });

      if (!apiKey) {
        return; // user cancelled
      }

      // Store in VS Code SecretStorage (secure, encrypted)
      await context.secrets.store(
        `openModel.${providerName}.apiKey`,
        apiKey.trim()
      );

      // Update the in-memory cache
      manager!.setApiKey(providerName, apiKey.trim());

      output.appendLine(
        `[${displayName}] API key updated via secret storage`
      );
      vscode.window.showInformationMessage(
        `Open Model: ${displayName} API key saved securely.`
      );

      // Refresh model lists in case this provider is now enabled
      manager!.notifyAll();
      manager!.logStatus();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.clearApiKey', async () => {
      const items = PROVIDER_NAMES.map((name) => ({
        label: PROVIDER_METADATA[name].displayName,
        description: name,
      }));

      const pick = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a provider to clear its API key',
        title: 'Open Model: Clear API Key',
      });

      if (!pick) {
        return;
      }

      const providerName = pick.description as ProviderName;
      await context.secrets.delete(`openModel.${providerName}.apiKey`);
      manager!.setApiKey(providerName, '');
      manager!.notifyAll();
      manager!.logStatus();

      vscode.window.showInformationMessage(
        `Open Model: ${PROVIDER_METADATA[providerName].displayName} API key cleared.`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.testConnection', async () => {
      const items = PROVIDER_NAMES.map((name) => ({
        label: PROVIDER_METADATA[name].displayName,
        description: name,
      }));

      const pick = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a provider to test connection',
        title: 'Open Model: Test Connection',
      });

      if (!pick) {
        return;
      }

      const providerName = pick.description as ProviderName;
      const apiKey = manager!.getApiKey(providerName);
      const { baseUrl, displayName } = PROVIDER_METADATA[providerName];

      if (!apiKey) {
        vscode.window.showErrorMessage(
          `${displayName} API key is not configured. Use "Open Model: Set API Key" first.`
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Testing ${displayName} connection...`,
        },
        async () => {
          try {
            const response = await fetch(`${baseUrl}/models`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (response.ok) {
              vscode.window.showInformationMessage(`${displayName}: Connection successful!`);
            } else {
              const errorText = await response.text();
              vscode.window.showErrorMessage(
                getFriendlyErrorMessage(response.status, displayName, errorText)
              );
            }
          } catch (err) {
            vscode.window.showErrorMessage(`${displayName}: Connection failed - ${err}`);
          }
        }
      );
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

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.exportConfig', exportConfigCommand)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.importConfig', importConfigCommand)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.showUsage', showUsageCommand(usageStore))
  );

  output.appendLine('Open Model extension activated.');
}

export function deactivate(): void {
  manager?.dispose();
  manager = undefined;
}
