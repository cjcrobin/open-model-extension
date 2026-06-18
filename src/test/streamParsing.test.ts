import { describe, it, expect } from 'vitest';
import { parseSSELine, ChatCompletionChunk } from '../provider';

describe('parseSSELine', () => {
  it('parses a standard SSE data line', () => {
    const line = 'data: {"choices":[{"delta":{"content":"hello"}}]}';
    const result = parseSSELine(line);
    expect(result).toEqual({ choices: [{ delta: { content: 'hello' } }] });
  });

  it('parses a compact SSE data line with no space after the colon (Kimi for Coding)', () => {
    const line = 'data:{"choices":[{"delta":{"content":"hi"}}]}';
    const result = parseSSELine(line);
    expect(result).toEqual({ choices: [{ delta: { content: 'hi' } }] });
  });

  it('returns null for empty line', () => {
    expect(parseSSELine('')).toBeNull();
    expect(parseSSELine('   ')).toBeNull();
  });

  it('returns null for data: [DONE]', () => {
    expect(parseSSELine('data: [DONE]')).toBeNull();
    expect(parseSSELine('data:[DONE]')).toBeNull();
  });

  it('returns null for non-data prefix lines', () => {
    expect(parseSSELine('event: ping')).toBeNull();
    expect(parseSSELine(': comment')).toBeNull();
    expect(parseSSELine('id: 123')).toBeNull();
  });

  it('throws SyntaxError for invalid JSON', () => {
    expect(() => parseSSELine('data: {invalid')).toThrow(SyntaxError);
  });

  it('parses reasoning_content delta', () => {
    const line = 'data: {"choices":[{"delta":{"reasoning_content":"thinking..."}}]}';
    const result = parseSSELine(line);
    expect(result?.choices[0]?.delta?.reasoning_content).toBe('thinking...');
  });

  it('parses streaming tool_calls chunks', () => {
    const line1 = 'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call-1","type":"function","function":{"name":"search","arguments":""}}]}}]}';
    const line2 = 'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"hello"}}]}}]}';

    const chunk1 = parseSSELine(line1);
    const chunk2 = parseSSELine(line2);

    expect(chunk1?.choices[0]?.delta?.tool_calls).toHaveLength(1);
    expect(chunk1?.choices[0]?.delta?.tool_calls?.[0]?.id).toBe('call-1');
    expect(chunk2?.choices[0]?.delta?.tool_calls?.[0]?.function?.arguments).toBe('hello');
  });

  it('parses finish_reason: tool_calls', () => {
    const line = 'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}';
    const result = parseSSELine(line) as ChatCompletionChunk;
    expect(result.choices[0].finish_reason).toBe('tool_calls');
  });
});
