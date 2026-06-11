# T015 - 为 429 和 401 错误码添加友好提示信息

**优先级:** P2 - 错误恢复
**依赖:** T006 (结构化 API 错误解析), T014 (重试逻辑)

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 在 `provideLanguageModelChatResponse` 的错误处理中增加特定错误码的用户提示
- `src/errors.ts`（新增）— 定义错误码到友好提示的映射

### 具体变更

1. 新建 `src/errors.ts`：
   ```ts
   export function getFriendlyErrorMessage(statusCode: number, providerName: string, originalMessage: string): string {
     const knownErrors: Record<number, string> = {
       401: `${providerName} API key is invalid or expired. Please use "Open Model: Set API Key" to update it.`,
       402: `${providerName} account has insufficient credits or quota. Please check your account balance.`,
       403: `${providerName} API access is forbidden. The API key may lack required permissions.`,
       404: `${providerName} model endpoint not found. Please verify the model ID in your settings.`,
       429: `${providerName} rate limit exceeded. Requests will be retried automatically.`,
       500: `${providerName} server error. The service may be temporarily unavailable.`,
       502: `${providerName} gateway error. Please try again later.`,
       503: `${providerName} service is temporarily unavailable. Please try again later.`,
     };
     return knownErrors[statusCode] ?? `${providerName} API error (${statusCode}): ${originalMessage}`;
   }
   ```

2. 在 `provider.ts` 中，将 `throw new Error(...)` 替换为调用 `getFriendlyErrorMessage`

## 边界条件

- 未映射的 status code 使用 fallback 格式 `${providerName} API error (${statusCode}): ${originalMessage}`
- 429 错误在重试期间不立即抛给用户（由 T014 的重试逻辑处理），仅在重试耗尽后才展示
- 401 错误提示应引导用户使用 Set API Key 命令更新
- 402 错误提示应引导用户检查账户余额

## 测试用例

1. `getFriendlyErrorMessage(401, 'DeepSeek', 'Unauthorized')` → 包含 "invalid or expired" 和 "Set API Key"
2. `getFriendlyErrorMessage(429, 'Kimi', 'Rate limit')` → 包含 "rate limit" 和 "retried automatically"
3. `getFriendlyErrorMessage(999, 'GLM', 'Unknown')` → fallback 格式 "GLM API error (999): Unknown"
4. `getFriendlyErrorMessage(402, 'Qwen', 'No credits')` → 包含 "insufficient credits"

## 验收要求

- [ ] `src/errors.ts` 存在并导出 `getFriendlyErrorMessage` 函数
- [ ] `provider.ts` 使用 `getFriendlyErrorMessage` 构造错误信息
- [ ] `npm run compile` 通过
- [ ] 至少覆盖 401、402、429、500 四个错误码的友好提示
