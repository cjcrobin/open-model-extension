import * as vscode from 'vscode';
import { ModelConfig, PROVIDER_METADATA, ProviderName } from './types';

// LanguageModelThinkingPart is an internal VS Code API not yet in @types/vscode.
// It renders a collapsible "Thinking..." block in Copilot Chat, identical to
// how native reasoning models (Claude, o3) are displayed.
// Constructor: (text: string, id?: string, metadata?: object)
// Pass { vscode_reasoning_done: true } as metadata to close the block.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ThinkingPart: new (text: string, id?: string, metadata?: object) => vscode.LanguageModelResponsePart =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (vscode as any).LanguageModelThinkingPart;

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

interface ChatCompletionChunk {
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
}

/**
 * Convert VS Code LanguageModelChatRequestMessage to OpenAI-compatible message format.
 */
function convertMessages(
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

    // Collect text parts and tool result parts separately
    const textParts: string[] = [];
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
    } else {
      result.push({ role, content: textParts.join('') });
    }
  }

  return result;
}

/**
 * OpenAI-compatible language model provider for a single vendor.
 * Implements the VS Code LanguageModelChatProvider interface.
 */
export class OpenAICompatProvider implements vscode.LanguageModelChatProvider {
  private readonly providerName: ProviderName;
  private readonly getModels: () => ModelConfig[];
  private readonly getApiKey: () => string;

  readonly onDidChangeLanguageModelChatInformation: vscode.Event<void>;
  private readonly _onDidChange: vscode.EventEmitter<void>;

  constructor(
    providerName: ProviderName,
    getApiKey: () => string,
    getModels: () => ModelConfig[]
  ) {
    this.providerName = providerName;
    this.getApiKey = getApiKey;
    this.getModels = getModels;
    this._onDidChange = new vscode.EventEmitter<void>();
    this.onDidChangeLanguageModelChatInformation = this._onDidChange.event;
  }

  /** Notify Copilot that the model list has changed */
  notifyChange(): void {
    this._onDidChange.fire();
  }

  dispose(): void {
    this._onDidChange.dispose();
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
    const { baseUrl, displayName } = PROVIDER_METADATA[this.providerName];

    if (!apiKey) {
      throw new Error(
        `${displayName} API key is not configured. ` +
          `Set openModel.${this.providerName}.apiKey in VS Code settings.`
      );
    }

    const convertedMessages = convertMessages(messages);

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

    const modelConfig = this.getModels().find((m) => m.id === model.id);

    const requestBody: Record<string, unknown> = {
      model: model.id,
      messages: convertedMessages,
      stream: true,
      ...(modelConfig?.maxOutputTokens ? { max_tokens: modelConfig.maxOutputTokens } : {}),
      ...(tools ? { tools, tool_choice: 'auto' } : {}),
    };

    const abortController = new AbortController();
    token.onCancellationRequested(() => abortController.abort());

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `${displayName} API request failed (${response.status}): ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error(`${displayName} API returned no response body`);
    }

    await this.streamResponse(response.body, progress, token);
  }

  async provideTokenCount(
    _model: vscode.LanguageModelChatInformation,
    text: string | vscode.LanguageModelChatRequestMessage,
    _token: vscode.CancellationToken
  ): Promise<number> {
    // Simple approximation: 1 token ≈ 4 characters
    const str =
      typeof text === 'string'
        ? text
        : text.content
            .map((p) => (p instanceof vscode.LanguageModelTextPart ? p.value : ''))
            .join('');
    return Math.ceil(str.length / 4);
  }

  private toModelInfo(m: ModelConfig): vscode.LanguageModelChatInformation {
    const { displayName } = PROVIDER_METADATA[this.providerName];
    return {
      id: m.id,
      name: m.name,
      family: displayName,
      version: m.id,
      maxInputTokens: m.maxInputTokens ?? 65536,
      maxOutputTokens: m.maxOutputTokens ?? 8192,
      capabilities: {
        toolCalling: true,
      },
    };
  }

  private async streamResponse(
    body: ReadableStream<Uint8Array>,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // Track partial tool call accumulation across chunks
    const pendingToolCalls = new Map<
      number,
      { id: string; name: string; args: string }
    >();
    // Track whether we have opened a ThinkingPart block
    let thinkingOpen = false;

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
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') {
            continue;
          }
          if (!trimmed.startsWith('data: ')) {
            continue;
          }

          try {
            const jsonStr = trimmed.slice('data: '.length);
            const chunk: ChatCompletionChunk = JSON.parse(jsonStr);
            const choice = chunk.choices?.[0];
            if (!choice?.delta) {
              continue;
            }

            const delta = choice.delta;

            // Reasoning tokens (DeepSeek R1, Kimi Thinking, QwQ)
            // Use internal LanguageModelThinkingPart if available (shows collapsible
            // "Thinking..." block like native models), otherwise discard.
            if (delta.reasoning_content) {
              if (ThinkingPart) {
                progress.report(new ThinkingPart(delta.reasoning_content));
                thinkingOpen = true;
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
                try { parsedArgs = JSON.parse(tc.args) as object; } catch { /* keep empty */ }
                progress.report(new vscode.LanguageModelToolCallPart(tc.id, tc.name, parsedArgs));
              }
              pendingToolCalls.clear();
            }
          } catch {
            // Skip malformed SSE lines
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
  }
}
