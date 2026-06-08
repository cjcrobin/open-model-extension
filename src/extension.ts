import * as vscode from 'vscode';
import { ProviderManager } from './manager';
import { PROVIDER_METADATA, ProviderName } from './types';

const PROVIDER_NAMES: ProviderName[] = ['kimi', 'deepseek', 'glm', 'qwen'];

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

  // Load API keys from secret storage into the manager's cache
  await loadApiKeys(context.secrets, manager, output);

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
    vscode.commands.registerCommand('openModel.setApiKey', async () => {
      // Let user pick which provider to set the API key for
      const items = PROVIDER_NAMES.map((name) => ({
        label: PROVIDER_METADATA[name].displayName,
        description: name,
      }));

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
