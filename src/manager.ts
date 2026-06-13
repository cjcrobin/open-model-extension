import * as vscode from 'vscode';
import { ModelConfig, PROVIDER_METADATA, PROVIDER_NAMES, ProviderName } from './types';
import { OpenAICompatProvider } from './provider';
import { UsageStore } from './storage/usageStore';
import { TokenUsageRecord } from './types/usage';
import { fetchAvailableModels } from './utils/fetchModels';
import { mergeFetchedModels } from './utils/mergeModels';

interface ProviderEntry {
  registration: vscode.Disposable;
  instance: OpenAICompatProvider;
}

function getNestedConfig<T>(name: ProviderName, key: string, defaultValue: T): T {
  return vscode.workspace.getConfiguration(`openModel.${name}`).get<T>(key, defaultValue);
}

function readProviderModels(name: ProviderName): ModelConfig[] {
  const enabled = getNestedConfig<boolean>(name, 'enabled', false);
  if (!enabled) {
    return [];
  }
  return getNestedConfig<ModelConfig[]>(name, 'models', []);
}

/**
 * Manages registration and lifecycle of all model providers.
 */
export class ProviderManager implements vscode.Disposable {
  private providers = new Map<ProviderName, ProviderEntry>();
  private apiKeys = new Map<ProviderName, string>();
  private readonly output: vscode.OutputChannel;
  private usageStore?: UsageStore;

  constructor(output: vscode.OutputChannel) {
    this.output = output;
  }

  setUsageStore(store: UsageStore): void {
    this.usageStore = store;
  }

  /**
   * Set a provider's API key in the in-memory cache.
   * Call this after storing it in SecretStorage.
   */
  setApiKey(name: ProviderName, key: string): void {
    this.apiKeys.set(name, key);
  }

  /**
   * Get a provider's API key from the in-memory cache.
   */
  getApiKey(name: ProviderName): string {
    return this.apiKeys.get(name) ?? '';
  }

  hasApiKey(name: ProviderName): boolean {
    return !!this.apiKeys.get(name);
  }

  /**
   * Register all four vendor providers. Each provider reads config dynamically.
   * Call once on activation; providers stay registered for the extension lifetime.
   */
  registerAll(): void {
    for (const name of PROVIDER_NAMES) {
      if (this.providers.has(name)) {
        continue; // already registered
      }

      const instance = new OpenAICompatProvider(
        name,
        () => this.getApiKey(name),
        () => readProviderModels(name),
        this.output,
        name === 'custom' ? () => getNestedConfig<string>('custom', 'baseUrl', '') : undefined,
        name === 'custom' ? () => getNestedConfig<string>('custom', 'vendorName', 'Custom') : undefined,
        () => getNestedConfig<Record<string, unknown>>(name, 'requestParams', {}),
        this.usageStore ? (record: TokenUsageRecord) => { this.usageStore!.addRecord(record); } : undefined
      );

      const registration = vscode.lm.registerLanguageModelChatProvider(
        name,
        instance
      );

      this.providers.set(name, { registration, instance });
      this.output.appendLine(
        `[${PROVIDER_METADATA[name].displayName}] Provider registered (vendor: ${name})`
      );
    }
  }

  /**
   * Notify Copilot that models may have changed (e.g. after settings update).
   */
  notifyAll(): void {
    for (const [, entry] of this.providers) {
      entry.instance.notifyChange();
    }
  }

  /**
   * Log current enabled state and warn about missing API keys.
   */
  logStatus(): void {
    this.output.appendLine('\n--- Provider Status ---');
    for (const name of PROVIDER_NAMES) {
      const enabled = getNestedConfig<boolean>(name, 'enabled', false);
      const apiKey = this.getApiKey(name);
      const models = getNestedConfig<ModelConfig[]>(name, 'models', []);
      const { displayName } = PROVIDER_METADATA[name];

      if (!enabled) {
        this.output.appendLine(`[${displayName}] Disabled`);
        continue;
      }

      if (!apiKey) {
        this.output.appendLine(`[${displayName}] Enabled but API key is missing!`);
        vscode.window.showWarningMessage(
          `Open Model: ${displayName} is enabled but has no API key. ` +
            `Use "Open Model: Set API Key" command to set it.`
        );
        continue;
      }

      this.output.appendLine(
        `[${displayName}] Enabled with ${models.length} model(s)`
      );
      for (const m of models) {
        this.output.appendLine(`  - ${m.name} (${m.id})`);
      }
    }
    this.output.appendLine('--- End Status ---\n');
  }

  async refreshProviderModels(name: ProviderName): Promise<void> {
    const apiKey = this.getApiKey(name);
    if (!apiKey) {
      return;
    }

    const baseUrl = name === 'custom'
      ? getNestedConfig<string>('custom', 'baseUrl', '')
      : PROVIDER_METADATA[name].baseUrl;

    if (!baseUrl) {
      return;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 10000);

    try {
      const response = await fetchAvailableModels(baseUrl, apiKey, abortController.signal);
      const existing = getNestedConfig<ModelConfig[]>(name, 'models', []);
      const merged = mergeFetchedModels(response.data, existing);

      await vscode.workspace
        .getConfiguration(`openModel.${name}`)
        .update('models', merged, vscode.ConfigurationTarget.Global);

      this.output.appendLine(
        `[${PROVIDER_METADATA[name].displayName}] Refreshed models: ${merged.length} model(s) available`,
      );
    } catch (err) {
      this.output.appendLine(
        `[${PROVIDER_METADATA[name].displayName}] Failed to refresh models: ${err}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  dispose(): void {
    for (const [name, entry] of this.providers) {
      entry.registration.dispose();
      entry.instance.dispose();
      this.output.appendLine(
        `[${PROVIDER_METADATA[name].displayName}] Provider unregistered`
      );
    }
    this.providers.clear();
  }
}
