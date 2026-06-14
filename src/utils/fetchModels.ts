import { ModelsApiResponse } from '../types';

export async function fetchAvailableModels(
  baseUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<ModelsApiResponse> {
  const url = `${baseUrl.replace(/\/+$/, '')}/models`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: HTTP ${response.status}`);
  }

  return response.json() as Promise<ModelsApiResponse>;
}
