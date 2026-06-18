import * as vscode from 'vscode';
import { PROVIDER_METADATA, PROVIDER_NAMES, ProviderName } from '../types';

export interface ConfigureResult {
  provider: ProviderName;
  apiKey: string;            // trimmed; empty string means user explicitly left it blank
  baseUrl?: string;          // populated only for 'custom'
}

interface ProviderPickItem extends vscode.QuickPickItem {
  providerName: ProviderName;
}

/**
 * Interactive Configure Provider wizard (T073: entry point + builtin flow).
 *
 * Steps:
 *   1. Pick a provider.
 *   2. Dispatch to the appropriate sub-flow:
 *        - kimi     → configureKimi()     (T075)
 *        - custom   → configureCustom()   (T074)
 *        - others   → configureBuiltin()  (this task)
 *   3. Return a ConfigureResult so the caller can persist the API key into
 *      SecretStorage + manager cache — we deliberately don't take a
 *      SecretStorage reference to keep this function easy to unit-test.
 *
 * Cancel at any step returns undefined (no side effects).
 */
export async function configureProviderCommand(): Promise<ConfigureResult | undefined> {
  const items: ProviderPickItem[] = PROVIDER_NAMES.map((name) => ({
    label: PROVIDER_METADATA[name].displayName,
    description: name,
    providerName: name,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    title: 'Open Model: Configure Provider (1/2)',
    placeHolder: 'Select a provider to configure',
  });

  if (!pick) return undefined;

  if (pick.providerName === 'kimi')   return configureKimi();
  if (pick.providerName === 'custom') return configureCustom();
  return configureBuiltin(pick.providerName);
}

async function configureBuiltin(name: ProviderName): Promise<ConfigureResult | undefined> {
  const { displayName } = PROVIDER_METADATA[name];

  const apiKey = await vscode.window.showInputBox({
    prompt: `Enter your ${displayName} API key`,
    placeHolder: 'sk-...',
    password: true,
    ignoreFocusOut: true,
    title: `Open Model: Configure ${displayName} (2/2)`,
    validateInput: (v) => (v.trim() ? undefined : 'API key cannot be empty'),
  });

  if (!apiKey) return undefined;

  vscode.window.showInformationMessage(
    `Open Model: ${displayName} API key captured. ` +
    `Run "Open Model: Toggle Provider" to enable it.`,
  );

  return { provider: name, apiKey: apiKey.trim() };
}

// T074 — Custom: URL + optional key
async function configureCustom(): Promise<ConfigureResult | undefined> {
  const baseUrl = await vscode.window.showInputBox({
    prompt: 'Enter the base URL of your OpenAI- or Anthropic-compatible endpoint',
    placeHolder: 'http://localhost:11434/v1',
    ignoreFocusOut: true,
    title: 'Open Model: Configure Custom (2/3)',
    validateInput: (v) => {
      const s = v.trim();
      if (!s) return 'URL cannot be empty';
      try {
        const u = new URL(s);
        if (!u.protocol || !u.hostname) {
          return 'Must be a valid URL (including scheme)';
        }
        return undefined;
      } catch {
        return 'Must be a valid URL (including scheme)';
      }
    },
  });
  if (!baseUrl) return undefined;

  const apiKey = await vscode.window.showInputBox({
    prompt: 'Enter the API key (leave empty for keyless local endpoints like Ollama / vLLM)',
    password: true,
    ignoreFocusOut: true,
    title: 'Open Model: Configure Custom (3/3)',
  });
  if (apiKey === undefined) return undefined;

  const trimmedUrl = baseUrl.trim();
  const trimmedKey = apiKey.trim();

  await vscode.workspace
    .getConfiguration('openModel.custom')
    .update('baseUrl', trimmedUrl, vscode.ConfigurationTarget.Global);

  if (trimmedKey) {
    vscode.window.showInformationMessage(
      'Open Model: Custom provider configured (URL + API key). ' +
      'Run "Open Model: Toggle Provider" to enable it.',
    );
  } else {
    vscode.window.showInformationMessage(
      'Open Model: Custom provider configured (URL only, no API key). ' +
      'Run "Open Model: Toggle Provider" to enable it.',
    );
  }

  return { provider: 'custom', apiKey: trimmedKey, baseUrl: trimmedUrl };
}

// T075 will implement configureKimi()
async function configureKimi(): Promise<ConfigureResult | undefined> {
  vscode.window.showInformationMessage(
    'Open Model: Kimi variant flow is not yet implemented.',
  );
  return undefined;
}
