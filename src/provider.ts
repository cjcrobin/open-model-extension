import * as vscode from 'vscode';
import { KIMI_VARIANT_METADATA, ModelConfig, PROVIDER_METADATA, ProviderName, ImageUnderstandingConfig } from './types';
import { getFriendlyErrorMessage } from './errors';
import { TokenUsageRecord } from './types/usage';
import { resolveSystemPrompt } from './utils/systemPrompt';
import { describeImages } from './utils/describeImages';
import { resolveKimiVariant } from './utils/kimiVariant';

// LanguageModelThinkingPart is an internal VS Code API not yet in @types/vscode.
// It renders a collapsible "Thinking..." block in Copilot Chat, identical to
// how native reasoning models (Claude, o3) are displayed.
// Constructor: (text: string, id?: string, metadata?: object)
// Pass { vscode_reasoning_done: true } as metadata to close the block.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ThinkingPart: new (text: string, id?: string, metadata?: object) => vscode.LanguageModelResponsePart =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vscode as any).LanguageModelThinkingPart;

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface ChatCompletionChunk {
  choices: Array<{
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    reasoning_tokens?: number;
  };
}

/**
 * Convert VS Code LanguageModelChatRequestMessage to OpenAI-compatible message format.
 */
export function convertMessages(
  messages: readonly vscode.LanguageModelChatRequestMessage[]
): ChatCompletionMessage[] {
  const result: ChatCompletionMessage[] = [];

  for (const msg of messages) {
    let role: 'system' | 'user' | 'assistant';
    if (msg.role === vscode.LanguageModelChatMessageRole.User) {
      role = 'user';
    } else if (msg.role === vscode.LanguageModelChatMessageRole.Assistant) {
      role = 'assistant';
    } else {
      role = 'system';
    }

    // Collect text parts, image parts, and tool result parts separately
    const textParts: string[] = [];
    const imageParts: Array<{ type: 'image_url'; image_url: { url: string } }> = [];
    const toolResults: Array<{ id: string; content: string }> = [];
    const toolCalls: Array<{ id: string; name: string; input: string }> = [];

    for (const part of msg.content) {
      if (part instanceof vscode.LanguageModelTextPart) {
        textParts.push(part.value);
      } else if (part instanceof vscode.LanguageModelToolCallPart) {
        toolCalls.push({
          id: part.callId,
          name: part.name,
          input: JSON.stringify(part.input),
        });
      } else if (part instanceof vscode.LanguageModelToolResultPart) {
        const content = part.content
          .map((p) => (p instanceof vscode.LanguageModelTextPart ? p.value : ''))
          .join('');
        toolResults.push({ id: part.callId, content });
      } else if (
        part &&
        typeof part === 'object' &&
        typeof (part as Record<string, unknown>).mimeType === 'string' &&
        (part as Record<string, unknown>).data instanceof Uint8Array &&
        (part as { mimeType: string }).mimeType.startsWith('image/')
      ) {
        const imagePart = part as { mimeType: string; data: Uint8Array };
        const base64 = Buffer.from(imagePart.data).toString('base64');
        imageParts.push({ type: 'image_url', image_url: { url: `data:${imagePart.mimeType};base64,${base64}` } });
      }
    }

    if (toolResults.length > 0) {
      // Tool results become separate tool-role messages
      for (const tr of toolResults) {
        result.push({ role: 'tool', content: tr.content, tool_call_id: tr.id });
      }
    } else if (toolCalls.length > 0) {
      result.push({
        role: 'assistant',
        content: textParts.join('') || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.input },
        })),
      });
    } else if (imageParts.length > 0) {
      const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];
      const text = textParts.join('');
      if (text) {
        content.push({ type: 'text', text });
      }
      content.push(...imageParts);
      result.push({ role, content });
    } else {
      result.push({ role, content: textParts.join('') });
    }
  }

  return result;
}

/**
 * Parse a single SSE line into a ChatCompletionChunk, or return null for non-data lines.
 */
export function parseSSELine(line: string): ChatCompletionChunk | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data: ')) {
    return null;
  }
  return JSON.parse(trimmed.slice('data: '.length));
}

/**
 * Estimate the token count for a given text, with CJK-aware logic.
 */
export function estimateTokenCount(text: string): number {
  let tokens = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0x3040 && code <= 0x309F) ||
      (code >= 0x30A0 && code <= 0x30FF) ||
      (code >= 0xAC00 && code <= 0xD7AF)
    ) {
      tokens += 1.5;
    } else {
      tokens += 0.25;
    }
  }
  return Math.ceil(tokens);
}

/**
 * Convert camelCase request params to snake_case API parameters.
 * The 'extra' field is spread directly into the request body.
 */
export function convertToApiParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (key === 'extra' && typeof value === 'object' && value !== null) {
      Object.assign(result, value);
    } else {
      const snakeKey = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
      result[snakeKey] = value;
    }
  }
  return result;
}

function stripImagesFromMessages(messages: ChatCompletionMessage[]): void {
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      const textOnly = m.content.filter(
        (p) => typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'text',
      ) as Array<{ type: 'text'; text: string }>;
      m.content = textOnly.map((p) => p.text).join('') || '';
    }
  }
}

/**
 * OpenAI-compatible language model provider for a single vendor.
 * Implements the VS Code LanguageModelChatProvider interface.
 */
export class OpenAICompatProvider implements vscode.LanguageModelChatProvider {
  private readonly providerName: ProviderName;
  private readonly getModels: () => ModelConfig[];
  private readonly getApiKey: () => string;
  private readonly output: vscode.OutputChannel;
  private readonly getBaseUrl?: () => string;
  private readonly getDisplayName?: () => string;
  private readonly getRequestParams?: () => Record<string, unknown>;
  private readonly onUsageRecord?: (record: TokenUsageRecord) => void;
  private readonly getProviderApiKey?: (provider: ProviderName) => string;

  readonly onDidChangeLanguageModelChatInformation: vscode.Event<void>;
  private readonly _onDidChange: vscode.EventEmitter<void>;

  constructor(
    providerName: ProviderName,
    getApiKey: () => string,
    getModels: () => ModelConfig[],
    output: vscode.OutputChannel,
    getBaseUrl?: () => string,
    getDisplayName?: () => string,
    getRequestParams?: () => Record<string, unknown>,
    onUsageRecord?: (record: TokenUsageRecord) => void,
    getProviderApiKey?: (provider: ProviderName) => string
  ) {
    this.providerName = providerName;
    this.getApiKey = getApiKey;
    this.getModels = getModels;
    this.output = output;
    this.getBaseUrl = getBaseUrl;
    this.getDisplayName = getDisplayName;
    this.getRequestParams = getRequestParams;
    this.onUsageRecord = onUsageRecord;
    this.getProviderApiKey = getProviderApiKey;
    this._onDidChange = new vscode.EventEmitter<void>();
    this.onDidChangeLanguageModelChatInformation = this._onDidChange.event;
  }

  /** Notify Copilot that the model list has changed */
  notifyChange(): void {
    this._onDidChange.fire();
  }

  private log(message: string): void {
    const ts = new Date().toISOString();
    this.output.appendLine(`[${ts}] [${this.providerName}] ${message}`);
  }

  /**
   * Build the outgoing request headers.
   *
   * - Always includes Content-Type + Bearer auth.
   * - For Kimi, consults the active KimiVariant (inferred from
   *   `openModel.kimi.baseUrl`) and merges the variant's extraHeaders. This
   *   is what injects the whitelisted `User-Agent: KimiCLI/1.5` when the
   *   user is on the Coding gateway.
   * - For other providers, merges any static `extraHeaders` declared in
   *   PROVIDER_METADATA (currently unused, kept as an extension point).
   */
  private buildRequestHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (this.providerName === 'kimi') {
      const extras = KIMI_VARIANT_METADATA[resolveKimiVariant()].extraHeaders;
      if (extras) Object.assign(headers, extras);
    } else {
      const extras = PROVIDER_METADATA[this.providerName].extraHeaders;
      if (extras) Object.assign(headers, extras);
    }

    return headers;
  }

  dispose(): void {
    this._onDidChange.dispose();
  }

  private async applyImageUnderstanding(
    messages: ChatCompletionMessage[],
  ): Promise<void> {
    const hasImages = messages.some(
      (m) =>
        Array.isArray(m.content) &&
        m.content.some((p) => typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'image_url'),
    );

    if (!hasImages) {
      return;
    }

    this.log('Image(s) detected in request for non-vision model');

    const imageConfig = vscode.workspace
      .getConfiguration('openModel')
      .get<ImageUnderstandingConfig>('imageUnderstandingModel', { provider: '', modelId: '' });

    if (!imageConfig.provider || !imageConfig.modelId || !this.getProviderApiKey) {
      this.log('No imageUnderstandingModel configured. Stripping images.');
      stripImagesFromMessages(messages);
      return;
    }

    const visionProvider = imageConfig.provider as ProviderName;
    const visionApiKey = this.getProviderApiKey(visionProvider);
    const visionBaseUrl =
      visionProvider === 'custom'
        ? vscode.workspace.getConfiguration('openModel.custom').get<string>('baseUrl', '')
        : PROVIDER_METADATA[visionProvider]?.baseUrl ?? '';

    if (!visionApiKey || !visionBaseUrl) {
      this.log(`Image understanding configured (${imageConfig.provider}/${imageConfig.modelId}) but API key or base URL missing. Stripping images.`);
      stripImagesFromMessages(messages);
      return;
    }

    const imageUrls: string[] = [];
    for (const m of messages) {
      if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (typeof part === 'object' && part !== null && (part as Record<string, unknown>).type === 'image_url') {
            imageUrls.push((part as { image_url: { url: string } }).image_url.url);
          }
        }
      }
    }

    this.log(`Requesting image description via ${imageConfig.provider}/${imageConfig.modelId} (${imageUrls.length} image(s))`);

    try {
      const descriptions = await describeImages(imageUrls, visionBaseUrl, visionApiKey, imageConfig.modelId);

      let descIndex = 0;
      for (const m of messages) {
        if (Array.isArray(m.content)) {
          const newContent: Array<{ type: 'text'; text: string }> = [];
          for (const part of m.content) {
            if (typeof part === 'object' && part !== null && (part as Record<string, unknown>).type === 'image_url') {
              const desc = descriptions[descIndex] ?? 'Unable to describe';
              newContent.push({ type: 'text', text: `[Image description: ${desc}]` });
              this.log(`Image ${descIndex + 1}: ${desc.length > 100 ? desc.slice(0, 100) + '...' : desc}`);
              descIndex++;
            } else {
              newContent.push(part as { type: 'text'; text: string });
            }
          }
          m.content = newContent;
        }
      }

      for (const m of messages) {
        if (
          Array.isArray(m.content) &&
          m.content.length === 1 &&
          (m.content[0] as Record<string, unknown>).type === 'text'
        ) {
          m.content = (m.content[0] as { type: 'text'; text: string }).text;
        }
      }

      this.log(`Image understanding completed: ${imageUrls.length} image(s) described`);
    } catch (err) {
      this.log(`Image understanding failed: ${err}`);
      stripImagesFromMessages(messages);
    }
  }

  provideLanguageModelChatInformation(
    _options: vscode.PrepareLanguageModelChatModelOptions,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.LanguageModelChatInformation[]> {
    const models = this.getModels();
    return models.map((m) => this.toModelInfo(m));
  }

  async provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken
  ): Promise<void> {
    const apiKey = this.getApiKey();
    const modelConfig = this.getModels().find((m) => m.id === model.id);
    const baseUrl = modelConfig?.baseUrlOverride?.trim()
      || (this.getBaseUrl ? this.getBaseUrl() : '')
      || PROVIDER_METADATA[this.providerName].baseUrl;
    const displayName = this.getDisplayName
      ? this.getDisplayName()
      : PROVIDER_METADATA[this.providerName].displayName;

    if (!apiKey && this.providerName !== 'custom') {
      throw new Error(
        `${displayName} API key is not configured. ` +
          `Use the "Open Model: Set API Key" command to set it.`
      );
    }

    this.log(`Chat request: model=${model.id}, baseUrl=${baseUrl}, messages=${messages.length}`);

    const convertedMessages = convertMessages(messages);

    if (!modelConfig?.supportsVision) {
      await this.applyImageUnderstanding(convertedMessages);
    }

    const systemPrompt = resolveSystemPrompt(this.providerName, model.id);
    if (systemPrompt) {
      convertedMessages.unshift({ role: 'system', content: systemPrompt });
      this.log(`System prompt injected (${systemPrompt.length} chars)`);
    }

    // Build tools array if tool calling is requested
    const tools =
      options.tools && options.tools.length > 0
        ? options.tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: t.inputSchema,
            },
          }))
        : undefined;

    const userParams = this.getRequestParams?.() ?? {};
    const apiParams = convertToApiParams(userParams);

    const requestBody: Record<string, unknown> = {
      model: model.id,
      messages: convertedMessages,
      stream: true,
      stream_options: { include_usage: true },
      ...apiParams,
      ...(modelConfig?.maxOutputTokens ? { max_tokens: modelConfig.maxOutputTokens } : {}),
      ...(tools ? { tools, tool_choice: 'auto' } : {}),
    };

    const abortController = new AbortController();
    token.onCancellationRequested(() => abortController.abort());

    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.buildRequestHeaders(apiKey),
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch { /* use raw text as fallback */ }

      this.log(`API error: HTTP ${response.status} — ${errorMessage}`);
      throw new Error(getFriendlyErrorMessage(response.status, displayName, errorMessage));
    }

    if (!response.body) {
      this.log('API error: empty response body');
      throw new Error(`${displayName} API returned no response body`);
    }

    const recordedUsage = await this.streamResponse(response.body, progress, token);

    const durationMs = Date.now() - startTime;
    if (recordedUsage) {
      this.log(
        `Chat completed in ${durationMs}ms — ` +
        `tokens: ${recordedUsage.prompt_tokens} in / ${recordedUsage.completion_tokens} out` +
        (recordedUsage.reasoning_tokens ? ` / ${recordedUsage.reasoning_tokens} reasoning` : ''),
      );
    } else {
      this.log(`Chat completed in ${durationMs}ms (no usage data returned)`);
    }

    if (token.isCancellationRequested) {
      this.log('Request cancelled by user');
    }

    if (recordedUsage && this.onUsageRecord) {
      this.onUsageRecord({
        provider: this.providerName,
        modelId: model.id,
        modelName: model.name,
        inputTokens: recordedUsage.prompt_tokens,
        outputTokens: recordedUsage.completion_tokens,
        reasoningTokens: recordedUsage.reasoning_tokens,
        timestamp: new Date().toISOString(),
        durationMs,
      });
    }
  }

  async provideTokenCount(
    _model: vscode.LanguageModelChatInformation,
    text: string | vscode.LanguageModelChatRequestMessage,
    _token: vscode.CancellationToken
  ): Promise<number> {
    if (typeof text === 'string') {
      return estimateTokenCount(text);
    }

    let imageCount = 0;
    const str = text.content
      .map((p) => {
        if (p instanceof vscode.LanguageModelTextPart) {
          return p.value;
        }
        if (
          p &&
          typeof p === 'object' &&
          typeof (p as Record<string, unknown>).mimeType === 'string' &&
          (p as Record<string, unknown>).data instanceof Uint8Array &&
          (p as { mimeType: string }).mimeType.startsWith('image/')
        ) {
          imageCount++;
        }
        return '';
      })
      .join('');

    return estimateTokenCount(str) + imageCount * 85;
  }

  private toModelInfo(m: ModelConfig): vscode.LanguageModelChatInformation {
    const displayName = this.getDisplayName
      ? this.getDisplayName()
      : PROVIDER_METADATA[this.providerName].displayName;
    const modelName = m.supportsReasoning ? `${m.name} (Reasoning)` : m.name;

    const imageConfig = vscode.workspace
      .getConfiguration('openModel')
      .get<ImageUnderstandingConfig>('imageUnderstandingModel', { provider: '', modelId: '' });
    const hasImageFallback = !!(imageConfig.provider && imageConfig.modelId);

    return {
      id: m.id,
      name: modelName,
      family: displayName,
      version: m.id,
      maxInputTokens: m.maxInputTokens ?? 65536,
      maxOutputTokens: m.maxOutputTokens ?? 8192,
      capabilities: {
        toolCalling: true,
        imageInput: !!m.supportsVision || hasImageFallback,
      },
    };
  }

  private async streamResponse(
    body: ReadableStream<Uint8Array>,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken
  ): Promise<{ prompt_tokens: number; completion_tokens: number; reasoning_tokens?: number } | undefined> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const pendingToolCalls = new Map<
      number,
      { id: string; name: string; args: string }
    >();
    let thinkingOpen = false;
    let recordedUsage: { prompt_tokens: number; completion_tokens: number; reasoning_tokens?: number } | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done || token.isCancellationRequested) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          try {
            const chunk = parseSSELine(line);
            if (!chunk) {
              continue;
            }

            if (chunk.usage) {
              recordedUsage = chunk.usage;
            }

            const choice = chunk.choices?.[0];
            if (!choice?.delta) {
              continue;
            }

            const delta = choice.delta;

            // Reasoning tokens (DeepSeek R1, Kimi Thinking, QwQ)
            // Use internal LanguageModelThinkingPart if available (shows collapsible
            // "Thinking..." block like native models), otherwise fall back to plain text.
            if (delta.reasoning_content) {
              if (ThinkingPart) {
                progress.report(new ThinkingPart(delta.reasoning_content));
                thinkingOpen = true;
              } else {
                // Fallback: output reasoning as plain text with a marker
                progress.report(new vscode.LanguageModelTextPart(delta.reasoning_content));
              }
            }

            // Regular text content — close the thinking block first if open
            if (delta.content) {
              if (thinkingOpen && ThinkingPart) {
                progress.report(new ThinkingPart('', '', { vscode_reasoning_done: true }));
                thinkingOpen = false;
              }
              progress.report(new vscode.LanguageModelTextPart(delta.content));
            }

            // Tool calls (streaming - accumulate)
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!pendingToolCalls.has(tc.index)) {
                  pendingToolCalls.set(tc.index, { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' });
                }
                const pending = pendingToolCalls.get(tc.index)!;
                if (tc.id) { pending.id = tc.id; }
                if (tc.function?.name) { pending.name = tc.function.name; }
                if (tc.function?.arguments) { pending.args += tc.function.arguments; }
              }
            }

            // When finish, emit accumulated tool calls
            if (choice.finish_reason === 'tool_calls') {
              for (const [, tc] of pendingToolCalls) {
                let parsedArgs: object = {};
                try { parsedArgs = JSON.parse(tc.args) as object; } catch {
                  const argsPreview = tc.args.length > 200 ? tc.args.slice(0, 200) + '...' : tc.args;
                this.log(
                    `Warning: Failed to parse tool call arguments for "${tc.name}": ${argsPreview}`,
                  );
                }
                progress.report(new vscode.LanguageModelToolCallPart(tc.id, tc.name, parsedArgs));
              }
              pendingToolCalls.clear();
            }
          } catch (e) {
            this.log(`Warning: Malformed SSE line skipped: ${line.length > 100 ? line.slice(0, 100) + '...' : line}`);
          }
        }
      }
    } finally {
      // Close any unclosed ThinkingPart block
      if (thinkingOpen && ThinkingPart) {
        progress.report(new ThinkingPart('', '', { vscode_reasoning_done: true }));
      }
      reader.releaseLock();
    }

    return recordedUsage;
  }
}
