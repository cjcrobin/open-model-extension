import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { resetMockConfig, setMockConfig } from './__mocks__/vscode';
import { toggleProviderCommand } from '../commands/toggleProvider';

describe('toggleProviderCommand', () => {
  beforeEach(() => {
    resetMockConfig();
    vi.mocked(vscode.window.showQuickPick).mockReset();
    vi.mocked(vscode.window.showInformationMessage).mockReset();
  });

  it('flips enabled=false to true and shows success message', async () => {
    setMockConfig('openModel.deepseek', 'enabled', false);

    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
      label: 'DeepSeek',
      description: 'deepseek',
      providerName: 'deepseek',
      currentEnabled: false,
    } as never);

    await toggleProviderCommand();

    const after = vscode.workspace
      .getConfiguration('openModel.deepseek')
      .get<boolean>('enabled', false);
    expect(after).toBe(true);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('enabled'),
    );
  });

  it('flips enabled=true to false', async () => {
    setMockConfig('openModel.deepseek', 'enabled', true);

    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
      label: 'DeepSeek',
      description: 'deepseek',
      providerName: 'deepseek',
      currentEnabled: true,
    } as never);

    await toggleProviderCommand();

    const after = vscode.workspace
      .getConfiguration('openModel.deepseek')
      .get<boolean>('enabled', false);
    expect(after).toBe(false);
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('disabled'),
    );
  });

  it('does not write to config when user cancels the picker', async () => {
    setMockConfig('openModel.deepseek', 'enabled', false);
    const updateSpy = vi.spyOn(
      vscode.workspace.getConfiguration('openModel.deepseek'),
      'update',
    );

    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(undefined as never);

    await toggleProviderCommand();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
  });

  it('presents one quickpick item per provider with accurate detail strings', async () => {
    setMockConfig('openModel.deepseek', 'enabled', true);
    setMockConfig('openModel.kimi', 'enabled', false);

    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(undefined as never);

    await toggleProviderCommand();

    const [items, options] = vi.mocked(vscode.window.showQuickPick).mock.calls[0];
    const list = items as Array<{ description: string; detail: string; currentEnabled: boolean }>;
    expect(list.map((i) => i.description)).toEqual([
      'kimi', 'deepseek', 'glm', 'qwen', 'doubao', 'minimax', 'custom',
    ]);
    expect(list.find((i) => i.description === 'deepseek')?.currentEnabled).toBe(true);
    expect(list.find((i) => i.description === 'deepseek')?.detail).toMatch(/Enabled/);
    expect(list.find((i) => i.description === 'kimi')?.currentEnabled).toBe(false);
    expect(list.find((i) => i.description === 'kimi')?.detail).toMatch(/Disabled/);
    expect(options).toMatchObject({ title: 'Open Model: Toggle Provider' });
  });
});
