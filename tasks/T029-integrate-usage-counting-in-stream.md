# T029 - 在流式响应中集成 Token 用量计数

**优先级:** P4 - 用量追踪
**依赖:** T028 (用量持久化存储已实现)

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 在 `streamResponse` 方法中解析 API 返回的 usage 信息，并通过回调上报

### 具体变更

1. 修改 `OpenAICompatProvider` 构造函数，增加 `onUsageRecord` 回调：
   ```ts
   constructor(
     providerName: ProviderName,
     getApiKey: () => string,
     getModels: () => ModelConfig[],
     getBaseUrl?: () => string,
     getDisplayName?: () => string,
     getRequestParams?: () => Record<string, unknown>,
     onUsageRecord?: (record: TokenUsageRecord) => void
   )
   ```

2. 在 `streamResponse` 方法中解析 SSE 最后一个 chunk 的 `usage` 字段：
   ```ts
   // 在 SSE chunk 接口中添加 usage
   interface ChatCompletionChunk {
     choices: Array<{...}>;
     usage?: {
       prompt_tokens: number;
       completion_tokens: number;
       reasoning_tokens?: number;
     };
   }

   // 在 streamResponse 循环中，当收到含 usage 的 chunk 时记录
   if (chunk.usage) {
     recordedUsage = chunk.usage;
   }
   ```

3. 流结束后调用回调：
   ```ts
   if (recordedUsage && this.onUsageRecord) {
     this.onUsageRecord({
       provider: this.providerName,
       modelId: model.id,
       modelName: model.name,
       inputTokens: recordedUsage.prompt_tokens,
       outputTokens: recordedUsage.completion_tokens,
       reasoningTokens: recordedUsage.reasoning_tokens,
       timestamp: new Date().toISOString(),
       durationMs: Date.now() - startTime,
     });
   }
   ```

4. 在 `manager.ts` 创建 provider 时传入回调，调用 `UsageStore.addRecord`

## 边界条件

- 并非所有 provider 的 API 都在 streaming 模式返回 `usage` 字段（OpenAI 需要 `stream_options: { include_usage: true }`）
- 需要在 requestBody 中添加 `stream_options: { include_usage: true }` 以请求 usage 返回
- 如果 API 未返回 usage，则不记录（静默跳过）
- `onUsageRecord` 为可选回调，未提供时不影响现有逻辑

## 测试用例

1. API 返回 usage → 回调被调用，参数包含正确的 token 数
2. API 未返回 usage → 回调不被调用
3. reasoning_tokens 存在时 → 记录到 `reasoningTokens`
4. `onUsageRecord` 为 undefined → 不报错

## 验收要求

- [ ] 请求体包含 `stream_options: { include_usage: true }`
- [ ] 流结束时正确解析 usage 信息
- [ ] 回调记录完整的 `TokenUsageRecord`
- [ ] `npm run compile` 通过
