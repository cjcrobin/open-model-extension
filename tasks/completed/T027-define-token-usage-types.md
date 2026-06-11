# T027 - 定义 TokenUsage 数据结构

**优先级:** P4 - 用量追踪
**依赖:** 无

## 需要修改/增加的内容

### 新增文件

- `src/types/usage.ts` — Token 用量追踪的数据类型定义

### 具体变更

```ts
/** Token usage for a single API request */
export interface TokenUsageRecord {
  /** Provider name */
  provider: string;
  /** Model ID */
  modelId: string;
  /** Model display name */
  modelName: string;
  /** Input tokens consumed */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Reasoning tokens (if applicable) */
  reasoningTokens?: number;
  /** ISO 8601 timestamp of the request */
  timestamp: string;
  /** Request duration in milliseconds */
  durationMs: number;
}

/** Aggregated usage statistics */
export interface UsageSummary {
  /** Total input tokens */
  totalInputTokens: number;
  /** Total output tokens */
  totalOutputTokens: number;
  /** Total reasoning tokens */
  totalReasoningTokens: number;
  /** Total number of requests */
  totalRequests: number;
  /** Usage breakdown by provider */
  byProvider: Record<string, {
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }>;
  /** Usage breakdown by model */
  byModel: Record<string, {
    inputTokens: number;
    outputTokens: number;
    requests: number;
  }>;
}

/** Filter options for querying usage */
export interface UsageFilter {
  /** Start date (ISO 8601) */
  startDate?: string;
  /** End date (ISO 8601) */
  endDate?: string;
  /** Filter by provider */
  provider?: string;
  /** Filter by model ID */
  modelId?: string;
}
```

## 边界条件

- 所有数值字段为非负整数
- `timestamp` 为 ISO 8601 格式字符串
- `reasoningTokens` 可选，非 reasoning 模型不记录
- `byProvider` 和 `byModel` 的 key 分别为 provider name 和 model id
- 类型定义不依赖任何 VS Code API

## 测试用例

1. `TokenUsageRecord` 对象可以只包含必填字段
2. `reasoningTokens` 可选
3. `UsageSummary` 的 `byProvider` 和 `byModel` 可包含任意数量的 key
4. `UsageFilter` 所有字段均可选

## 验收要求

- [ ] `src/types/usage.ts` 文件存在
- [ ] 导出 `TokenUsageRecord`、`UsageSummary`、`UsageFilter` 三个接口
- [ ] `npm run compile` 通过
