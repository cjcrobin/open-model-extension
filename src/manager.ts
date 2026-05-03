import * as vscode from 'vscode';
import { ModelConfig, PROVIDER_METADATA, ProviderName } from './types';
import { OpenAICompatProvider } from './provider';

const PROVIDER_NAMES: ProviderName[] = ['kimi', 'deepseek', 'glm', 'qwen'];

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

function readApiKey(name: ProviderName): string {
  return getNestedConfig<string>(name, 'apiKey', '');
}

/**
 * Manages registration and lifecycle of all model providers.
 */
export class ProviderManager implements vscode.Disposable {
  private providers = new Map<ProviderName, ProviderEntry>();
  private readonly output: vscode.OutputChannel;

  constructor(output: vscode.OutputChannel) {
    this.output = output;
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
        () => readApiKey(name),
        () => readProviderModels(name)
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
      const apiKey = readApiKey(name);
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
            `Set openModel.${name}.apiKey in settings.`
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
