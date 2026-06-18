import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { configureProviderCommand } from '../commands/configureProvider';

describe('configureProviderCommand — builtin key flow', () => {
  beforeEach(() => {
    vi.mocked(vscode.window.showQuickPick).mockReset();
    vi.mocked(vscode.window.showInputBox).mockReset();
    vi.mocked(vscode.window.showInformationMessage).mockReset();
  });

  it('returns { provider, apiKey } for DeepSeek when both prompts succeed', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
      label: 'DeepSeek',
      description: 'deepseek',
      providerName: 'deepseek',
    } as never);
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce('  sk-test-key  ');

    const result = await configureProviderCommand();

    expect(result).toEqual({ provider: 'deepseek', apiKey: 'sk-test-key' });
    expect(vscode.window.showInputBox).toHaveBeenCalledWith(
      expect.objectContaining({
        password: true,
        title: 'Open Model: Configure DeepSeek (2/2)',
      }),
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Toggle Provider'),
    );
  });

  it('returns undefined when user cancels the provider picker', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(undefined as never);

    const result = await configureProviderCommand();

    expect(result).toBeUndefined();
    expect(vscode.window.showInputBox).not.toHaveBeenCalled();
  });

  it('returns undefined when user cancels the key input', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
      label: 'DeepSeek',
      description: 'deepseek',
      providerName: 'deepseek',
    } as never);
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce(undefined);

    const result = await configureProviderCommand();

    expect(result).toBeUndefined();
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  it('validateInput rejects empty / whitespace-only keys', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
      label: 'GLM',
      description: 'glm',
      providerName: 'glm',
    } as never);
    vi.mocked(vscode.window.showInputBox).mockImplementation(async (opts) => {
      const validator = opts?.validateInput as ((v: string) => string | undefined) | undefined;
      expect(validator?.('')).toBe('API key cannot be empty');
      expect(validator?.('   ')).toBe('API key cannot be empty');
      expect(validator?.('sk-real')).toBeUndefined();
      return 'sk-real';
    });

    const result = await configureProviderCommand();

    expect(result).toEqual({ provider: 'glm', apiKey: 'sk-real' });
  });
});
