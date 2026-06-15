import { describe, it, expect } from 'vitest';
import { convertMessages } from '../provider';
import {
  LanguageModelChatMessageRole,
  LanguageModelTextPart,
  LanguageModelToolCallPart,
  LanguageModelToolResultPart,
  LanguageModelDataPart,
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

  it('converts message with text and image to multimodal content', () => {
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const messages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: [
          new LanguageModelTextPart('What is this?'),
          LanguageModelDataPart.image(imageData, 'image/png'),
        ],
        name: undefined,
      } as unknown as LanguageModelChatRequestMessage,
    ];
    const result = convertMessages(messages);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('user');
    expect(result[0].content).toEqual([
      { type: 'text', text: 'What is this?' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw==' } },
    ]);
  });

  it('converts message with only image (no text)', () => {
    const imageData = new Uint8Array([0xff, 0xd8, 0xff]);
    const messages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: [LanguageModelDataPart.image(imageData, 'image/jpeg')],
        name: undefined,
      } as unknown as LanguageModelChatRequestMessage,
    ];
    const result = convertMessages(messages);
    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual([
      { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,/9j/' } },
    ]);
  });

  it('ignores non-image DataPart', () => {
    const messages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: [
          new LanguageModelTextPart('Hello'),
          LanguageModelDataPart.json({ key: 'value' }),
        ],
        name: undefined,
      } as unknown as LanguageModelChatRequestMessage,
    ];
    const result = convertMessages(messages);
    expect(result).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('includes multiple images in content array', () => {
    const img1 = new Uint8Array([0x01]);
    const img2 = new Uint8Array([0x02]);
    const messages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: [
          new LanguageModelTextPart('Compare these'),
          LanguageModelDataPart.image(img1, 'image/png'),
          LanguageModelDataPart.image(img2, 'image/jpeg'),
        ],
        name: undefined,
      } as unknown as LanguageModelChatRequestMessage,
    ];
    const result = convertMessages(messages);
    expect(result[0].content).toEqual([
      { type: 'text', text: 'Compare these' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,AQ==' } },
      { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,Ag==' } },
    ]);
  });

  it('detects image parts via duck typing (plain object)', () => {
    const imageData = new Uint8Array([0xab, 0xcd]);
    const plainImagePart = { mimeType: 'image/png', data: imageData };
    const messages = [
      {
        role: LanguageModelChatMessageRole.User,
        content: [
          new LanguageModelTextPart('Describe'),
          plainImagePart,
        ],
        name: undefined,
      } as unknown as LanguageModelChatRequestMessage,
    ];
    const result = convertMessages(messages);
    expect(result[0].content).toEqual([
      { type: 'text', text: 'Describe' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,q80=' } },
    ]);
  });
});
