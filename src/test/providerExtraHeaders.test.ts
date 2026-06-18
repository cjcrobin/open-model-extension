import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { resetMockConfig, setMockConfig } from './__mocks__/vscode';
import { OpenAICompatProvider } from '../provider';

function createOutput(): vscode.OutputChannel {
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

function userMessage(text: string): vscode.LanguageModelChatRequestMessage {
  return {
    role: vscode.LanguageModelChatMessageRole.User,
    content: [new vscode.LanguageModelTextPart(text)],
    name: undefined,
  } as unknown as vscode.LanguageModelChatRequestMessage;
}

function makeProgress(): vscode.Progress<vscode.LanguageModelResponsePart> {
  return { report: () => {} };
}

function makeToken(): vscode.CancellationToken {
  return {
    isCancellationRequested: false,
    onCancellationRequested: vi.fn(() => ({ dispose: vi.fn() })),
  } as unknown as vscode.CancellationToken;
}

describe('OpenAICompatProvider — vendor extraHeaders', () => {
  beforeEach(() => {
    resetMockConfig();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not inject extra headers for Kimi when no variant override is active', async () => {
    const kimiModel = { id: 'kimi-k2.6', name: 'Kimi K2.6' };
    const provider = new OpenAICompatProvider(
      'kimi',
      () => 'km-test-key',
      () => [kimiModel],
      createOutput(),
    );

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n'));
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
    } as Response);

    const modelInfo = {
      id: 'kimi-k2.6',
      name: 'Kimi K2.6',
      family: 'Kimi',
      version: 'kimi-k2.6',
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      capabilities: { toolCalling: false, imageInput: false },
    } as unknown as vscode.LanguageModelChatInformation;

    await provider.provideLanguageModelChatResponse(
      modelInfo,
      [userMessage('hi')],
      {} as vscode.ProvideLanguageModelChatResponseOptions,
      makeProgress(),
      makeToken(),
    );

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['User-Agent']).toBeUndefined();
    expect(headers['X-Client-Name']).toBeUndefined();
    expect(headers).toMatchObject({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer km-test-key',
    });
  });

  it('does not inject extra headers for providers without extras (deepseek)', async () => {
    const model = { id: 'deepseek-chat', name: 'DeepSeek Chat' };
    const provider = new OpenAICompatProvider(
      'deepseek',
      () => 'ds-key',
      () => [model],
      createOutput(),
    );

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
    } as Response);

    const modelInfo = {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      family: 'DeepSeek',
      version: 'deepseek-chat',
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      capabilities: { toolCalling: false, imageInput: false },
    } as unknown as vscode.LanguageModelChatInformation;

    await provider.provideLanguageModelChatResponse(
      modelInfo,
      [userMessage('hi')],
      {} as vscode.ProvideLanguageModelChatResponseOptions,
      makeProgress(),
      makeToken(),
    );

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['User-Agent']).toBeUndefined();
    expect(headers['X-Client-Name']).toBeUndefined();
  });

  it('injects KimiCLI User-Agent when Kimi is configured for the Coding gateway', async () => {
    setMockConfig('openModel.kimi', 'baseUrl', 'https://api.kimi.com/coding/v1');
    const kimiModel = { id: 'kimi-for-coding', name: 'Kimi for Coding' };
    const provider = new OpenAICompatProvider(
      'kimi',
      () => 'km-test-key',
      () => [kimiModel],
      createOutput(),
    );

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
    } as Response);

    const modelInfo = {
      id: 'kimi-for-coding',
      name: 'Kimi for Coding',
      family: 'Kimi',
      version: 'kimi-for-coding',
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      capabilities: { toolCalling: false, imageInput: false },
    } as unknown as vscode.LanguageModelChatInformation;

    await provider.provideLanguageModelChatResponse(
      modelInfo,
      [userMessage('hi')],
      {} as vscode.ProvideLanguageModelChatResponseOptions,
      makeProgress(),
      makeToken(),
    );

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers).toMatchObject({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer km-test-key',
      'User-Agent': 'KimiCLI/1.5',
      'X-Client-Name': 'KimiCLI',
    });
  });

  it('Kimi routes to the baseUrl from configuration (wizard-written) rather than the hardcoded PROVIDER_METADATA default', async () => {
    setMockConfig('openModel.kimi', 'baseUrl', 'https://api.kimi.com/coding/v1');
    const kimiModel = { id: 'kimi-for-coding', name: 'Kimi for Coding' };
    const provider = new OpenAICompatProvider(
      'kimi',
      () => 'km-test-key',
      () => [kimiModel],
      createOutput(),
    );

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
    } as Response);

    const modelInfo = {
      id: 'kimi-for-coding',
      name: 'Kimi for Coding',
      family: 'Kimi',
      version: 'kimi-for-coding',
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      capabilities: { toolCalling: false, imageInput: false },
    } as unknown as vscode.LanguageModelChatInformation;

    await provider.provideLanguageModelChatResponse(
      modelInfo,
      [userMessage('hi')],
      {} as vscode.ProvideLanguageModelChatResponseOptions,
      makeProgress(),
      makeToken(),
    );

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.kimi.com/coding/v1/chat/completions');
    expect(url).not.toContain('api.moonshot.cn');
  });

  it('does NOT inject KimiCLI User-Agent when Kimi baseUrl points to an unknown proxy', async () => {
    setMockConfig('openModel.kimi', 'baseUrl', 'https://proxy.example.com/v1');
    const kimiModel = { id: 'kimi-k2.6', name: 'Kimi K2.6' };
    const provider = new OpenAICompatProvider(
      'kimi',
      () => 'km-test-key',
      () => [kimiModel],
      createOutput(),
    );

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
    } as Response);

    const modelInfo = {
      id: 'kimi-k2.6',
      name: 'Kimi K2.6',
      family: 'Kimi',
      version: 'kimi-k2.6',
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      capabilities: { toolCalling: false, imageInput: false },
    } as unknown as vscode.LanguageModelChatInformation;

    await provider.provideLanguageModelChatResponse(
      modelInfo,
      [userMessage('hi')],
      {} as vscode.ProvideLanguageModelChatResponseOptions,
      makeProgress(),
      makeToken(),
    );

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['User-Agent']).toBeUndefined();
    expect(headers['X-Client-Name']).toBeUndefined();
  });
});
