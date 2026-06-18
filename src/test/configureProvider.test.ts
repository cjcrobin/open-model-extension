import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { resetMockConfig } from './__mocks__/vscode';
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

describe('configureProviderCommand — custom url+key flow', () => {
  beforeEach(() => {
    resetMockConfig();
    vi.mocked(vscode.window.showQuickPick).mockReset();
    vi.mocked(vscode.window.showInputBox).mockReset();
    vi.mocked(vscode.window.showInformationMessage).mockReset();
  });

  function pickCustom(): void {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
      label: 'Custom',
      description: 'custom',
      providerName: 'custom',
    } as never);
  }

  it('writes baseUrl + returns trimmed key when URL and key are provided', async () => {
    pickCustom();
    vi.mocked(vscode.window.showInputBox)
      .mockResolvedValueOnce('  http://localhost:11434/v1  ')
      .mockResolvedValueOnce('  ollama-secret  ');

    const result = await configureProviderCommand();

    expect(result).toEqual({
      provider: 'custom',
      apiKey: 'ollama-secret',
      baseUrl: 'http://localhost:11434/v1',
    });
    const stored = vscode.workspace
      .getConfiguration('openModel.custom')
      .get<string>('baseUrl');
    expect(stored).toBe('http://localhost:11434/v1');
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('URL + API key'),
    );
  });

  it('accepts empty key for keyless endpoints and still writes baseUrl', async () => {
    pickCustom();
    vi.mocked(vscode.window.showInputBox)
      .mockResolvedValueOnce('http://localhost:8000/v1')
      .mockResolvedValueOnce('');

    const result = await configureProviderCommand();

    expect(result).toEqual({
      provider: 'custom',
      apiKey: '',
      baseUrl: 'http://localhost:8000/v1',
    });
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('no API key'),
    );
  });

  it('validateInput rejects malformed URLs', async () => {
    pickCustom();
    const validatorResults: Array<string | undefined> = [];
    const validatorInputs: string[] = [];
    let callCount = 0;
    vi.mocked(vscode.window.showInputBox).mockImplementation(async (opts) => {
      callCount += 1;
      if (callCount === 1) {
        const validator = opts?.validateInput as ((v: string) => string | undefined) | undefined;
        for (const probe of ['not-a-url', 'localhost:11434', 'http://localhost:11434/v1']) {
          validatorInputs.push(probe);
          validatorResults.push(validator?.(probe));
        }
        return 'http://localhost:11434/v1';
      }
      return '';
    });

    const result = await configureProviderCommand();

    expect(result?.baseUrl).toBe('http://localhost:11434/v1');
    expect(validatorInputs).toEqual([
      'not-a-url',
      'localhost:11434',
      'http://localhost:11434/v1',
    ]);
    expect(validatorResults).toEqual([
      'Must be a valid URL (including scheme)',
      'Must be a valid URL (including scheme)',
      undefined,
    ]);
  });

  it('returns undefined when user cancels the URL step', async () => {
    pickCustom();
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce(undefined);

    const result = await configureProviderCommand();

    expect(result).toBeUndefined();
    expect(vscode.window.showInputBox).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when user cancels the key step (after URL)', async () => {
    pickCustom();
    vi.mocked(vscode.window.showInputBox)
      .mockResolvedValueOnce('http://localhost:11434/v1')
      .mockResolvedValueOnce(undefined);

    const result = await configureProviderCommand();

    expect(result).toBeUndefined();
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });
});
