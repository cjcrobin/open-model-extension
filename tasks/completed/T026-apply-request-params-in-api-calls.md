# T026 - 在 API 请求中应用 RequestParams

**优先级:** P4 - 高级请求参数
**依赖:** T004 (RequestParams 接口已定义), T025 (配置项已注册)

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 在构建 API 请求 body 时合并用户配置的 requestParams
- `src/manager.ts` — 为 `OpenAICompatProvider` 增加获取 requestParams 的回调

### 具体变更

1. 修改 `OpenAICompatProvider` 构造函数，增加 `getRequestParams` 回调：
   ```ts
   constructor(
     providerName: ProviderName,
     getApiKey: () => string,
     getModels: () => ModelConfig[],
     getBaseUrl?: () => string,
     getDisplayName?: () => string,
     getRequestParams?: () => Record<string, unknown>
   )
   ```

2. 在 `manager.ts` 中创建 provider 时传入：
   ```ts
   () => {
     const params = getNestedConfig<Record<string, unknown>>(name, 'requestParams', {});
     return params;
   }
   ```

3. 在 `provider.ts` 的 `provideLanguageModelChatResponse` 中构建 requestBody 时合并：
   ```ts
   const userParams = this.getRequestParams?.() ?? {};
   // 将 camelCase 转为 snake_case for API
   const apiParams = convertToApiParams(userParams);

   const requestBody = {
     model: model.id,
     messages: convertedMessages,
     stream: true,
     ...apiParams,
     ...(modelConfig?.maxOutputTokens ? { max_tokens: modelConfig.maxOutputTokens } : {}),
     ...(tools ? { tools, tool_choice: 'auto' } : {}),
   };
   ```

4. 新增参数名转换工具函数（可放在 `src/utils.ts`）：
   ```ts
   function convertToApiParams(params: Record<string, unknown>): Record<string, unknown> {
     const result: Record<string, unknown> = {};
     for (const [key, value] of Object.entries(params)) {
       if (key === 'extra' && typeof value === 'object') {
         Object.assign(result, value);
       } else {
         // camelCase → snake_case: frequencyPenalty → frequency_penalty
         const snakeKey = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
         result[snakeKey] = value;
       }
     }
     return result;
   }
   ```

## 边界条件

- 空 requestParams `{}` 时不改变现有请求行为
- `extra` 对象中的字段直接展开到请求体顶层
- 用户参数不应覆盖 `model`、`messages`、`stream` 等核心字段
- camelCase 参数名需转为 API 需要的 snake_case

## 测试用例

1. 空 requestParams → 请求体与改动前一致
2. `{ temperature: 0.7 }` → 请求体包含 `"temperature": 0.7`
3. `{ frequencyPenalty: 0.5 }` → 请求体包含 `"frequency_penalty": 0.5`
4. `{ extra: { reasoning_effort: "high" } }` → 请求体包含 `"reasoning_effort": "high"`
5. 用户参数不覆盖 `model` 字段

## 验收要求

- [ ] API 请求体中包含用户配置的 requestParams
- [ ] camelCase 正确转为 snake_case
- [ ] `extra` 字段正确展开
- [ ] 核心请求字段不被用户参数覆盖
- [ ] `npm run compile` 通过
