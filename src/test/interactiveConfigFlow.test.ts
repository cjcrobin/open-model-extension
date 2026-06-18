import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import {
  resetMockConfig,
  resetRegisteredCommands,
  getRegisteredCommand,
} from './__mocks__/vscode';
import { activate } from '../extension';
import { OpenAICompatProvider } from '../provider';

function createMockContext(): vscode.ExtensionContext {
  const secretStore = new Map<string, string>();
  return {
    subscriptions: [],
    secrets: {
      get: vi.fn(async (k: string) => secretStore.get(k)),
      store: vi.fn(async (k: string, v: string) => { secretStore.set(k, v); }),
      delete: vi.fn(async (k: string) => { secretStore.delete(k); }),
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

describe('interactive configure + toggle end-to-end', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    resetMockConfig();
    resetRegisteredCommands();
    vi.clearAllMocks();
    context = createMockContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Configure Provider (Kimi → Code → key) persists secret, baseUrl, extraHeaders, defaultModels', async () => {
    await activate(context);

    vi.mocked(vscode.window.showQuickPick)
      .mockResolvedValueOnce({ providerName: 'kimi' } as never)
      .mockResolvedValueOnce({ variant: 'code' } as never);
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce('km-secret');

    const configure = getRegisteredCommand('openModel.configureProvider');
    expect(configure).toBeDefined();
    await configure!();

    expect(context.secrets.store).toHaveBeenCalledWith(
      'openModel.kimi.apiKey',
      'km-secret',
    );

    const cfg = vscode.workspace.getConfiguration('openModel.kimi');
    expect(cfg.get('baseUrl')).toBe('https://api.kimi.com/coding/v1');
    expect(cfg.get('extraHeaders')).toEqual({
      'User-Agent': 'KimiCLI/1.5',
      'X-Client-Name': 'KimiCLI',
    });
    const models = cfg.get<Array<{ id: string }>>('models', []);
    expect(models.map((m) => m.id)).toEqual(['kimi-for-coding']);
  });

  it('Configure Provider (Custom → URL + empty key) persists baseUrl and CLEARS the secret', async () => {
    await activate(context);
    // Seed a pre-existing custom key to prove the clear path runs.
    await context.secrets.store('openModel.custom.apiKey', 'stale-key');
    vi.mocked(context.secrets.store).mockClear();

    vi.mocked(vscode.window.showQuickPick)
      .mockResolvedValueOnce({ providerName: 'custom' } as never);
    vi.mocked(vscode.window.showInputBox)
      .mockResolvedValueOnce('http://localhost:11434/v1')
      .mockResolvedValueOnce('');

    const configure = getRegisteredCommand('openModel.configureProvider');
    await configure!();

    expect(context.secrets.store).not.toHaveBeenCalled();
    expect(context.secrets.delete).toHaveBeenCalledWith('openModel.custom.apiKey');
    const cfg = vscode.workspace.getConfiguration('openModel.custom');
    expect(cfg.get('baseUrl')).toBe('http://localhost:11434/v1');
  });

  it('Toggle Provider flips openModel.deepseek.enabled and persists globally', async () => {
    await activate(context);
    vi.mocked(vscode.window.showQuickPick).mockImplementation(async (items) => {
      const arr = items as Array<{ providerName: string; currentEnabled: boolean }>;
      return arr.find((i) => i.providerName === 'deepseek') as never;
    });

    const toggle = getRegisteredCommand('openModel.toggleProvider');
    await toggle!();

    const enabled = vscode.workspace
      .getConfiguration('openModel.deepseek')
      .get<boolean>('enabled', false);
    expect(enabled).toBe(true);
  });

  it('after applying Kimi Code variant, the next chat request carries the KimiCLI User-Agent', async () => {
    await activate(context);

    vi.mocked(vscode.window.showQuickPick)
      .mockResolvedValueOnce({ providerName: 'kimi' } as never)
      .mockResolvedValueOnce({ variant: 'code' } as never);
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce('km-secret');

    const configure = getRegisteredCommand('openModel.configureProvider');
    await configure!();

    // Drive a Kimi chat request and assert the UA is on the wire.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
    }));

    const provider = new OpenAICompatProvider(
      'kimi',
      () => 'km-secret',
      () => [{ id: 'kimi-for-coding', name: 'Kimi for Coding' }],
      { appendLine: vi.fn() } as unknown as vscode.OutputChannel,
    );

    const modelInfo = {
      id: 'kimi-for-coding',
      name: 'Kimi for Coding',
      family: 'Kimi',
      version: 'kimi-for-coding',
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      capabilities: { toolCalling: false, imageInput: false },
    } as unknown as vscode.LanguageModelChatInformation;

    const userMsg = {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [new vscode.LanguageModelTextPart('hi')],
    } as unknown as vscode.LanguageModelChatRequestMessage;

    await provider.provideLanguageModelChatResponse(
      modelInfo,
      [userMsg],
      {} as vscode.ProvideLanguageModelChatResponseOptions,
      { report: () => {} },
      {
        isCancellationRequested: false,
        onCancellationRequested: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as vscode.CancellationToken,
    );

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers).toMatchObject({
      'User-Agent': 'KimiCLI/1.5',
      'X-Client-Name': 'KimiCLI',
    });

    vi.unstubAllGlobals();
  });
});
