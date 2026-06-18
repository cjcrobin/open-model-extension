import * as vscode from 'vscode';
import { ProviderManager } from './manager';
import { PROVIDER_METADATA, PROVIDER_NAMES, ProviderName } from './types';
import { getFriendlyErrorMessage } from './errors';
import { UsageStore } from './storage/usageStore';
import { exportConfigCommand } from './commands/exportConfig';
import { importConfigCommand } from './commands/importConfig';
import { showUsageCommand } from './commands/showUsage';
import { toggleProviderCommand } from './commands/toggleProvider';
import { configureProviderCommand } from './commands/configureProvider';
import { createStatusBarItem, updateStatusBar } from './ui/statusBar';
import { ConfigPanel } from './webview/configPanel';

let manager: ProviderManager | undefined;

function log(output: vscode.OutputChannel, message: string): void {
  output.appendLine(`[${new Date().toISOString()}] ${message}`);
}

async function loadApiKeys(
  secrets: vscode.SecretStorage,
  manager: ProviderManager,
  output: vscode.OutputChannel
): Promise<void> {
  for (const name of PROVIDER_NAMES) {
    const key = await secrets.get(`openModel.${name}.apiKey`);
    if (key) {
      manager.setApiKey(name, key);
      log(output, `[${PROVIDER_METADATA[name].displayName}] API key loaded from secret storage`);
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
        log(output, 'Configuration changed, refreshing model lists...');
        manager!.notifyAll();
        manager!.logStatus();
        updateStatusBar(statusBarItem);
      }
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.reload', () => {
      log(output, 'Manual refresh triggered');
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

      log(output, `[${displayName}] API key set via command`);
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
      log(output, `[${PROVIDER_METADATA[providerName].displayName}] API key cleared`);
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
        log(output, `[${displayName}] Test connection skipped: no API key`);
        vscode.window.showErrorMessage(
          `${displayName} API key is not configured. Use "Open Model: Set API Key" first.`
        );
        return;
      }

      log(output, `[${displayName}] Testing connection to ${baseUrl}/models...`);

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
              log(output, `[${displayName}] Connection test successful (HTTP ${response.status})`);
              vscode.window.showInformationMessage(`${displayName}: Connection successful!`);
            } else {
              const errorText = await response.text();
              log(output, `[${displayName}] Connection test failed: HTTP ${response.status} — ${errorText.slice(0, 200)}`);
              vscode.window.showErrorMessage(
                getFriendlyErrorMessage(response.status, displayName, errorText)
              );
            }
          } catch (err) {
            log(output, `[${displayName}] Connection test error: ${err}`);
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

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.openConfigPanel', () => {
      log(output, 'Configuration panel opened');
      ConfigPanel.show(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.refreshModels', async () => {
      const candidates: { name: ProviderName; detail: string }[] = [];
      for (const name of PROVIDER_NAMES) {
        const enabled = vscode.workspace.getConfiguration(`openModel.${name}`).get<boolean>('enabled', false);
        if (!enabled) {
          continue;
        }
        const apiKey = manager!.getApiKey(name);
        const baseUrl = name === 'custom'
          ? vscode.workspace.getConfiguration(`openModel.${name}`).get<string>('baseUrl', '')
          : PROVIDER_METADATA[name].baseUrl;
        if (!apiKey || !baseUrl) {
          continue;
        }
        const models = vscode.workspace.getConfiguration(`openModel.${name}`).get<unknown[]>('models', []);
        candidates.push({
          name,
          detail: `${models.length} model(s) configured`,
        });
      }

      if (candidates.length === 0) {
        log(output, 'Refresh command: no enabled providers with API keys and base URLs');
        vscode.window.showInformationMessage(
          'Open Model: No enabled providers with API keys to refresh.',
        );
        return;
      }

      const picks = await vscode.window.showQuickPick(
        candidates.map((c) => ({
          label: PROVIDER_METADATA[c.name].displayName,
          description: c.name,
          detail: c.detail,
        })),
        {
          placeHolder: 'Select one or more providers to refresh their model lists from vendor APIs',
          title: 'Open Model: Refresh Models',
          canPickMany: true,
        },
      );
      if (!picks || picks.length === 0) {
        return;
      }

      const selected = picks.map((p) => p.description as ProviderName);
      log(output, `Refreshing models for ${selected.join(', ')}...`);
      vscode.window.showInformationMessage(
        `Open Model: Refreshing models for ${selected.map((n) => PROVIDER_METADATA[n].displayName).join(', ')}...`,
      );
      for (const providerName of selected) {
        const { displayName } = PROVIDER_METADATA[providerName];
        manager!.refreshProviderModels(providerName).catch((err) => {
          log(output, `[${displayName}] Refresh command failed: ${err}`);
        });
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.toggleProvider', toggleProviderCommand),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('openModel.configureProvider', async () => {
      const result = await configureProviderCommand();
      if (!result) return;

      await context.secrets.store(`openModel.${result.provider}.apiKey`, result.apiKey);
      manager!.setApiKey(result.provider, result.apiKey);
      log(output, `[${PROVIDER_METADATA[result.provider].displayName}] API key saved via Configure Provider`);
    }),
  );

  log(output, 'Open Model extension activated.');
}

export function deactivate(): void {
  manager?.dispose();
  manager = undefined;
}
