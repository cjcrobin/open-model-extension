export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
  onRetry?: (attempt: number, delayMs: number, error: string) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: Partial<RetryOptions> = {}
): Promise<Response> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    const response = await fetch(url, init);

    if (response.ok || !opts.retryableStatusCodes.includes(response.status)) {
      return response;
    }

    lastResponse = response;

    if (attempt >= opts.maxRetries) {
      break;
    }

    let delayMs: number;
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        const seconds = Number(retryAfter);
        delayMs = Number.isFinite(seconds) ? seconds * 1000 : opts.initialDelayMs;
      } else {
        delayMs = opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt);
      }
    } else {
      delayMs = opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt);
    }

    delayMs = Math.min(delayMs, opts.maxDelayMs);

    opts.onRetry?.(attempt + 1, delayMs, `HTTP ${response.status}`);

    await sleep(delayMs, init.signal);
  }

  return lastResponse!;
}
