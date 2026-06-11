# T014 - 实现指数退避重试逻辑

**优先级:** P2 - 错误恢复
**依赖:** T006 (结构化 API 错误解析已实现)

## 需要修改/增加的内容

### 新增文件

- `src/retry.ts` — 可复用的指数退避重试工具函数

### 具体变更

新建 `src/retry.ts`：
```ts
export interface RetryOptions {
  /** Maximum number of retries (not counting initial attempt) */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Multiplier for each subsequent retry */
  backoffFactor: number;
  /** Maximum delay cap in milliseconds */
  maxDelayMs: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatusCodes: number[];
  /** Callback invoked before each retry */
  onRetry?: (attempt: number, delayMs: number, error: string) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: Partial<RetryOptions> = {}
): Promise<Response> {
  // Implementation: attempt fetch, check response status,
  // retry with exponential backoff on retryable status codes,
  // respect Retry-After header for 429 responses
}
```

## 边界条件

- `AbortSignal` 被触发时应立即停止重试，不吞掉 `AbortError`
- 429 响应应优先使用 `Retry-After` header 的值作为延迟时间
- `Retry-After` header 不存在时使用指数退避计算
- 重试次数达到 `maxRetries` 后返回最后一次响应（不抛异常）
- `onRetry` 回调为可选，用于向 OutputChannel 写日志
- 仅对 `retryableStatusCodes` 中的状态码进行重试，其他错误直接返回

## 测试用例

1. **首次成功** → 直接返回 response，不触发重试
2. **429 + Retry-After: 2** → 等待约 2 秒后重试
3. **500 连续失败 3 次** → 重试 3 次后返回最后的 500 response
4. **408 → 成功** → 第一次 408，第二次成功，返回成功 response
5. **401 不重试** → 直接返回 401 response，不触发重试
6. **AbortSignal 取消** → 立即抛出 AbortError，停止重试
7. **延迟不超过 maxDelayMs** → 即使计算值超过 cap，也使用 maxDelayMs

## 验收要求

- [ ] `src/retry.ts` 文件存在，导出 `fetchWithRetry` 函数和 `RetryOptions` 接口
- [ ] `DEFAULT_RETRY_OPTIONS` 常量已导出
- [ ] `npm run compile` 通过
- [ ] 函数处理 AbortSignal 取消场景不抛非预期异常
