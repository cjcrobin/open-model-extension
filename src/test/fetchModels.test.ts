import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAvailableModels } from '../utils/fetchModels';
import { ModelsApiResponse } from '../types';

describe('fetchAvailableModels', () => {
  const baseUrl = 'https://api.example.com/v1';
  const apiKey = 'test-api-key';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ModelsApiResponse on successful request', async () => {
    const mockResponse: ModelsApiResponse = {
      object: 'list',
      data: [
        { id: 'model-a', object: 'model', owned_by: 'org' },
        { id: 'model-b', object: 'model' },
      ],
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchAvailableModels(baseUrl, apiKey);

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/models',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );
  });

  it('strips trailing slash from baseUrl', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ object: 'list', data: [] }),
    } as Response);

    await fetchAvailableModels('https://api.example.com/v1/', apiKey);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/models',
      expect.anything(),
    );
  });

  it('throws on HTTP 401', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    await expect(fetchAvailableModels(baseUrl, apiKey)).rejects.toThrow('401');
  });

  it('throws on HTTP 500', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchAvailableModels(baseUrl, apiKey)).rejects.toThrow('500');
  });

  it('throws AbortError when signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    vi.mocked(fetch).mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(
      fetchAvailableModels(baseUrl, apiKey, controller.signal),
    ).rejects.toThrow('aborted');
  });

  it('passes signal to fetch', async () => {
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ object: 'list', data: [] }),
    } as Response);

    await fetchAvailableModels(baseUrl, apiKey, controller.signal);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
