import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { resetMockConfig, setMockConfig } from './__mocks__/vscode';
import { ProviderManager } from '../manager';

vi.mock('../utils/fetchModels', () => ({
  fetchAvailableModels: vi.fn(),
}));

import { fetchAvailableModels } from '../utils/fetchModels';

const mockFetch = vi.mocked(fetchAvailableModels);

function createOutputChannel(): vscode.OutputChannel {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    name: 'test',
    replace: vi.fn(),
  } as unknown as vscode.OutputChannel;
}

describe('ProviderManager.refreshProviderModels', () => {
  let output: vscode.OutputChannel;
  let manager: ProviderManager;

  beforeEach(() => {
    resetMockConfig();
    output = createOutputChannel();
    manager = new ProviderManager(output);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns early when API key is empty', async () => {
    await manager.refreshProviderModels('deepseek');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns early when baseUrl is empty for custom provider', async () => {
    manager.setApiKey('custom', 'test-key');

    await manager.refreshProviderModels('custom');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches and merges models on success', async () => {
    manager.setApiKey('deepseek', 'test-key');
    setMockConfig('openModel.deepseek', 'models', [
      { id: 'existing-model', name: 'Existing' },
    ]);

    mockFetch.mockResolvedValue({
      object: 'list',
      data: [
        { id: 'existing-model', object: 'model' },
        { id: 'new-model', object: 'model' },
      ],
    });

    await manager.refreshProviderModels('deepseek');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1',
      'test-key',
      expect.any(AbortSignal),
    );

    const updatedModels = vscode.workspace.getConfiguration('openModel.deepseek').get('models');
    expect(updatedModels).toHaveLength(2);
    expect(updatedModels[0]).toEqual({ id: 'existing-model', name: 'Existing' });
    expect(updatedModels[1]).toEqual({ id: 'new-model', name: 'new-model' });

    expect(output.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('Refreshed: 2 model(s)'),
    );
  });

  it('logs error and does not update config on API failure', async () => {
    manager.setApiKey('deepseek', 'test-key');

    mockFetch.mockRejectedValue(new Error('Failed to fetch models: HTTP 401'));

    await manager.refreshProviderModels('deepseek');

    expect(output.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('Failed to refresh models'),
    );
  });

  it('reads baseUrl from config for custom provider', async () => {
    manager.setApiKey('custom', 'test-key');
    setMockConfig('openModel.custom', 'baseUrl', 'https://my.custom.api.com/v1');

    mockFetch.mockResolvedValue({
      object: 'list',
      data: [],
    });

    await manager.refreshProviderModels('custom');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://my.custom.api.com/v1',
      'test-key',
      expect.any(AbortSignal),
    );
  });
});
