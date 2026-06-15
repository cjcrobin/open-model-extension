import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { describeImages } from '../utils/describeImages';

describe('describeImages', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array for empty input without calling fetch', async () => {
    const result = await describeImages([], 'https://api.example.com/v1', 'key', 'model');
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns description for a single image', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'A cat sitting on a sofa.' } }],
      }),
    } as Response);

    const result = await describeImages(
      ['data:image/png;base64,abc'],
      'https://api.example.com/v1',
      'key',
      'deepseek-v4-flash',
    );

    expect(result).toEqual(['A cat sitting on a sofa.']);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer key' },
      }),
    );
  });

  it('returns descriptions for multiple images', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'First image description.' } }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Second image description.' } }],
        }),
      } as Response);

    const result = await describeImages(
      ['data:image/png;base64,a', 'data:image/jpeg;base64,b'],
      'https://api.example.com/v1',
      'key',
      'model',
    );

    expect(result).toEqual(['First image description.', 'Second image description.']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws on HTTP 401', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response);

    await expect(
      describeImages(['data:image/png;base64,a'], 'https://api.example.com/v1', 'key', 'model'),
    ).rejects.toThrow('401');
  });

  it('throws on HTTP 500', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(
      describeImages(['data:image/png;base64,a'], 'https://api.example.com/v1', 'key', 'model'),
    ).rejects.toThrow('500');
  });

  it('strips trailing slash from baseUrl', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'desc' } }] }),
    } as Response);

    await describeImages(['data:image/png;base64,a'], 'https://api.example.com/v1/', 'key', 'model');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/chat/completions',
      expect.anything(),
    );
  });

  it('sends stream: false and correct model in request body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'desc' } }] }),
    } as Response);

    await describeImages(['data:image/png;base64,a'], 'https://api.example.com/v1', 'key', 'my-vision-model');

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.stream).toBe(false);
    expect(body.model).toBe('my-vision-model');
  });

  it('propagates AbortError when signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    vi.mocked(fetch).mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(
      describeImages(['data:image/png;base64,a'], 'https://api.example.com/v1', 'key', 'model', controller.signal),
    ).rejects.toThrow('aborted');
  });
});
