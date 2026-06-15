import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { resetMockConfig, setMockConfig } from './__mocks__/vscode';

vi.mock('../utils/describeImages', () => ({
  describeImages: vi.fn(),
}));

import { describeImages } from '../utils/describeImages';
import { OpenAICompatProvider } from '../provider';

const mockDescribeImages = vi.mocked(describeImages);

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

function createProvider(
  models: Array<{ id: string; name: string; supportsVision?: boolean }>,
  getProviderApiKey?: (provider: string) => string,
): { provider: OpenAICompatProvider; output: vscode.OutputChannel } {
  const output = createOutputChannel();
  const provider = new OpenAICompatProvider(
    'deepseek',
    () => 'test-api-key',
    () => models,
    output,
    undefined,
    undefined,
    undefined,
    undefined,
    getProviderApiKey as ((provider: import('../types').ProviderName) => string) | undefined,
  );
  return { provider, output };
}

const mockModel = { id: 'deepseek-chat', name: 'DeepSeek Chat' };
const visionModel = { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', supportsVision: true };

const mockProgress = {
  report: vi.fn(),
} as unknown as vscode.Progress<vscode.LanguageModelResponsePart>;

const mockToken = {
  isCancellationRequested: false,
  onCancellationRequested: vi.fn(() => ({ dispose: vi.fn() })),
} as unknown as vscode.CancellationToken;

const mockOptions = { tools: [] } as unknown as vscode.ProvideLanguageModelChatResponseOptions;

const imageMessage = {
  role: 1,
  content: [
    { value: 'What is this?' },
    { mimeType: 'image/png', data: new Uint8Array([0x89, 0x50]) },
  ],
  name: undefined,
} as unknown as vscode.LanguageModelChatRequestMessage;

describe('Image understanding fallback', () => {
  beforeEach(() => {
    resetMockConfig();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"response"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n'));
          controller.close();
        },
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call describeImages when model supports vision', async () => {
    const { provider } = createProvider([visionModel]);

    await provider.provideLanguageModelChatResponse(
      visionModel as unknown as vscode.LanguageModelChatInformation,
      [imageMessage],
      mockOptions,
      mockProgress,
      mockToken,
    );

    expect(mockDescribeImages).not.toHaveBeenCalled();
  });

  it('calls describeImages and replaces images when configured', async () => {
    setMockConfig('openModel', 'imageUnderstandingModel', { provider: 'deepseek', modelId: 'deepseek-v4-flash' });
    mockDescribeImages.mockResolvedValue(['A red circle on white background']);

    const { provider, output } = createProvider(
      [mockModel],
      () => 'vision-api-key',
    );

    await provider.provideLanguageModelChatResponse(
      mockModel as unknown as vscode.LanguageModelChatInformation,
      [imageMessage],
      mockOptions,
      mockProgress,
      mockToken,
    );

    expect(mockDescribeImages).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('data:image/png;base64')]),
      'https://api.deepseek.com/v1',
      'vision-api-key',
      'deepseek-v4-flash',
    );
    expect(output.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('Used deepseek/deepseek-v4-flash to describe 1 image(s)'),
    );
  });

  it('strips images and logs warning when not configured', async () => {
    const { provider, output } = createProvider([mockModel]);

    await provider.provideLanguageModelChatResponse(
      mockModel as unknown as vscode.LanguageModelChatInformation,
      [imageMessage],
      mockOptions,
      mockProgress,
      mockToken,
    );

    expect(mockDescribeImages).not.toHaveBeenCalled();
    expect(output.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('no imageUnderstandingModel configured'),
    );
  });

  it('strips images and logs error when describeImages fails', async () => {
    setMockConfig('openModel', 'imageUnderstandingModel', { provider: 'deepseek', modelId: 'deepseek-v4-flash' });
    mockDescribeImages.mockRejectedValue(new Error('Failed to describe image: HTTP 500'));

    const { provider, output } = createProvider(
      [mockModel],
      () => 'vision-api-key',
    );

    await provider.provideLanguageModelChatResponse(
      mockModel as unknown as vscode.LanguageModelChatInformation,
      [imageMessage],
      mockOptions,
      mockProgress,
      mockToken,
    );

    expect(output.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('Image understanding failed'),
    );
  });

  it('strips images and logs warning when vision API key is missing', async () => {
    setMockConfig('openModel', 'imageUnderstandingModel', { provider: 'deepseek', modelId: 'deepseek-v4-flash' });

    const { provider, output } = createProvider(
      [mockModel],
      () => '',
    );

    await provider.provideLanguageModelChatResponse(
      mockModel as unknown as vscode.LanguageModelChatInformation,
      [imageMessage],
      mockOptions,
      mockProgress,
      mockToken,
    );

    expect(mockDescribeImages).not.toHaveBeenCalled();
    expect(output.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('API key or base URL not set'),
    );
  });

  it('does nothing when no images in messages', async () => {
    const textOnlyMessage = {
      role: 1,
      content: [{ value: 'Hello world' }],
      name: undefined,
    } as unknown as vscode.LanguageModelChatRequestMessage;

    const { provider } = createProvider([mockModel]);

    await provider.provideLanguageModelChatResponse(
      mockModel as unknown as vscode.LanguageModelChatInformation,
      [textOnlyMessage],
      mockOptions,
      mockProgress,
      mockToken,
    );

    expect(mockDescribeImages).not.toHaveBeenCalled();
  });
});
