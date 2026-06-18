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

// T074 will implement configureCustom()
async function configureCustom(): Promise<ConfigureResult | undefined> {
  vscode.window.showInformationMessage(
    'Open Model: Custom provider flow is not yet implemented.',
  );
  return undefined;
}

// T075 will implement configureKimi()
async function configureKimi(): Promise<ConfigureResult | undefined> {
  vscode.window.showInformationMessage(
    'Open Model: Kimi variant flow is not yet implemented.',
  );
  return undefined;
}
