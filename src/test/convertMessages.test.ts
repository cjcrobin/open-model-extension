import { describe, it, expect } from 'vitest';
import { convertMessages } from '../provider';
import {
  LanguageModelChatMessageRole,
  LanguageModelTextPart,
  LanguageModelToolCallPart,
  LanguageModelToolResultPart,
} from 'vscode';
import type { LanguageModelChatRequestMessage } from 'vscode';

function makeMessage(
  role: LanguageModelChatMessageRole,
  content: Array<LanguageModelTextPart | LanguageModelToolCallPart | LanguageModelToolResultPart>
): LanguageModelChatRequestMessage {
  return { role, content, name: undefined } as unknown as LanguageModelChatRequestMessage;
}

describe('convertMessages', () => {
  it('converts user text message', () => {
    const messages = [makeMessage(LanguageModelChatMessageRole.User, [new LanguageModelTextPart('Hello')])];
    const result = convertMessages(messages);
    expect(result).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('converts assistant text message', () => {
    const messages = [makeMessage(LanguageModelChatMessageRole.Assistant, [new LanguageModelTextPart('Hi there')])];
    const result = convertMessages(messages);
    expect(result).toEqual([{ role: 'assistant', content: 'Hi there' }]);
  });

  it('converts system message', () => {
    const messages = [makeMessage(LanguageModelChatMessageRole.System, [new LanguageModelTextPart('You are helpful')])];
    const result = convertMessages(messages);
    expect(result).toEqual([{ role: 'system', content: 'You are helpful' }]);
  });

  it('converts assistant message with tool calls', () => {
    const messages = [
      makeMessage(LanguageModelChatMessageRole.Assistant, [
        new LanguageModelTextPart('Let me check'),
        new LanguageModelToolCallPart('call-1', 'get_weather', { city: 'NYC' }),
      ]),
    ];
    const result = convertMessages(messages);
    expect(result).toEqual([
      {
        role: 'assistant',
        content: 'Let me check',
        tool_calls: [
          {
            id: 'call-1',
            type: 'function',
            function: { name: 'get_weather', arguments: JSON.stringify({ city: 'NYC' }) },
          },
        ],
      },
    ]);
  });

  it('converts tool result messages', () => {
    const messages = [
      makeMessage(LanguageModelChatMessageRole.User, [
        new LanguageModelToolResultPart('call-1', [new LanguageModelTextPart('Sunny, 25C')]),
      ]),
    ];
    const result = convertMessages(messages);
    expect(result).toEqual([{ role: 'tool', content: 'Sunny, 25C', tool_call_id: 'call-1' }]);
  });

  it('converts mixed content with text and tool calls', () => {
    const messages = [
      makeMessage(LanguageModelChatMessageRole.Assistant, [
        new LanguageModelTextPart('Part one'),
        new LanguageModelToolCallPart('call-2', 'search', { query: 'test' }),
      ]),
    ];
    const result = convertMessages(messages);
    expect(result).toEqual([
      {
        role: 'assistant',
        content: 'Part one',
        tool_calls: [
          {
            id: 'call-2',
            type: 'function',
            function: { name: 'search', arguments: JSON.stringify({ query: 'test' }) },
          },
        ],
      },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(convertMessages([])).toEqual([]);
  });

  it('merges multiple TextParts into single content string', () => {
    const messages = [
      makeMessage(LanguageModelChatMessageRole.User, [
        new LanguageModelTextPart('Hello '),
        new LanguageModelTextPart('world'),
      ]),
    ];
    const result = convertMessages(messages);
    expect(result).toEqual([{ role: 'user', content: 'Hello world' }]);
  });
});
