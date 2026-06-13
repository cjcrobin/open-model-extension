import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { resetMockConfig, setMockConfig, getRegisteredCommand, resetRegisteredCommands } from './__mocks__/vscode';

vi.mock('../utils/fetchModels', () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue({ object: 'list', data: [] }),
}));

import { fetchAvailableModels } from '../utils/fetchModels';
import { activate } from '../extension';

const mockFetch = vi.mocked(fetchAvailableModels);

function createMockContext(): vscode.ExtensionContext {
  const secretStore = new Map<string, string>();
  return {
    subscriptions: [],
    secrets: {
      get: vi.fn(async (key: string) => secretStore.get(key)),
      store: vi.fn(async (key: string, value: string) => { secretStore.set(key, value); }),
      delete: vi.fn(async (key: string) => { secretStore.delete(key); }),
      onDidChange: vi.fn(),
    },
    extensionUri: { fsPath: '/mock/extension' },
    extensionPath: '/mock/extension',
    globalState: { get: vi.fn(), update: vi.fn(), keys: vi.fn(() => []) },
    workspaceState: { get: vi.fn(), update: vi.fn(), keys: vi.fn(() => []) },
    storagePath: '/mock/storage',
    globalStoragePath: '/mock/globalStorage',
    logPath: '/mock/log',
    extensionMode: 1,
    environmentVariableCollection: {} as unknown,
    asAbsolutePath: vi.fn((p: string) => `/mock/extension/${p}`),
    storageUri: undefined,
    globalStorageUri: undefined,
    logUri: undefined,
    extension: {} as unknown,
    languageModelAccessInformation: {} as unknown,
  } as unknown as vscode.ExtensionContext;
}

describe('extension.ts auto-refresh and refresh command', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    resetMockConfig();
    resetRegisteredCommands();
    vi.clearAllMocks();
    context = createMockContext();
    mockFetch.mockResolvedValue({ object: 'list', data: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startup auto-refresh', () => {
    it('triggers refresh for enabled provider with API key', async () => {
      setMockConfig('openModel.deepseek', 'enabled', true);
      vi.mocked(context.secrets.get).mockImplementation(async (key: string) => {
        if (key === 'openModel.deepseek.apiKey') {
          return 'test-key';
        }
        return undefined;
      });

      await activate(context);
      await new Promise((r) => setTimeout(r, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1',
        'test-key',
        expect.any(AbortSignal),
      );
    });

    it('does not refresh when no providers are enabled', async () => {
      await activate(context);
      await new Promise((r) => setTimeout(r, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not refresh when provider is enabled but has no API key', async () => {
      setMockConfig('openModel.deepseek', 'enabled', true);

      await activate(context);
      await new Promise((r) => setTimeout(r, 10));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('manual refresh command', () => {
    it('triggers refresh for qualifying providers and shows notification', async () => {
      setMockConfig('openModel.deepseek', 'enabled', true);
      vi.mocked(context.secrets.get).mockImplementation(async (key: string) => {
        if (key === 'openModel.deepseek.apiKey') {
          return 'test-key';
        }
        return undefined;
      });

      await activate(context);

      mockFetch.mockClear();

      const handler = getRegisteredCommand('openModel.refreshModels');
      expect(handler).toBeDefined();

      await handler!();
      await new Promise((r) => setTimeout(r, 10));

      expect(mockFetch).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('DeepSeek'),
      );
    });

    it('shows "no enabled providers" when none qualify', async () => {
      await activate(context);

      const handler = getRegisteredCommand('openModel.refreshModels');
      expect(handler).toBeDefined();

      await handler!();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('No enabled providers'),
      );
    });
  });

  it('activation succeeds even if refresh fails', async () => {
    setMockConfig('openModel.deepseek', 'enabled', true);
    vi.mocked(context.secrets.get).mockImplementation(async (key: string) => {
      if (key === 'openModel.deepseek.apiKey') {
        return 'test-key';
      }
      return undefined;
    });
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(activate(context)).resolves.toBeUndefined();
  });
});
