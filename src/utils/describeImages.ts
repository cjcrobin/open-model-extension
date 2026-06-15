export async function describeImages(
  imageUrls: string[],
  baseUrl: string,
  apiKey: string,
  modelId: string,
  signal?: AbortSignal,
): Promise<string[]> {
  if (imageUrls.length === 0) {
    return [];
  }

  const descriptions: string[] = [];
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  for (const imageUrl of imageUrls) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        stream: false,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image in detail.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to describe image: HTTP ${response.status}`);
    }

    const data = await response.json();
    const description = data?.choices?.[0]?.message?.content ?? '';
    descriptions.push(description);
  }

  return descriptions;
}
