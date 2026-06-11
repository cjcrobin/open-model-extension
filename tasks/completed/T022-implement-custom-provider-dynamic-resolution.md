# T022 - 为 Custom Provider 实现动态 Base URL 和 DisplayName 解析

**优先级:** P3 - 自定义端点
**依赖:** T021 (Custom provider 已注册到 types.ts), T019 (baseUrlOverride 逻辑已实现)

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 修改 `OpenAICompatProvider`，使 custom provider 能动态读取 baseUrl 和 displayName
- `src/manager.ts` — 在创建 custom provider 实例时传入动态配置读取逻辑

### 具体变更

1. 在 `provider.ts` 中，修改 `OpenAICompatProvider` 构造函数，增加可选的 `getBaseUrl` 和 `getDisplayName` 回调：
   ```ts
   constructor(
     providerName: ProviderName,
     getApiKey: () => string,
     getModels: () => ModelConfig[],
     getBaseUrl?: () => string,
     getDisplayName?: () => string
   )
   ```

2. 在 `provideLanguageModelChatResponse` 中解析 baseUrl 时：
   ```ts
   const baseUrl = modelConfig?.baseUrlOverride?.trim()
     || (this.getBaseUrl ? this.getBaseUrl() : '')
     || PROVIDER_METADATA[this.providerName].baseUrl;
   ```

3. 在 `manager.ts` 创建 custom provider 时传入：
   ```ts
   const instance = new OpenAICompatProvider(
     name,
     () => this.getApiKey(name),
     () => readProviderModels(name),
     name === 'custom' ? () => getNestedConfig<string>('custom', 'baseUrl', '') : undefined,
     name === 'custom' ? () => getNestedConfig<string>('custom', 'vendorName', 'Custom') : undefined
   );
   ```

## 边界条件

- 对于非 custom provider，`getBaseUrl` 和 `getDisplayName` 为 `undefined`，使用 `PROVIDER_METADATA` 默认值
- Custom provider 的 `baseUrl` 为空时，API 请求应报明确错误而非发往空 URL
- `getDisplayName` 和 `getBaseUrl` 每次调用时动态读取配置，支持用户修改后无需重启

## 测试用例

1. Custom provider + 用户配置了 baseUrl → 请求发往用户配置的 URL
2. Custom provider + 未配置 baseUrl → 抛出明确错误 "Custom provider base URL is not configured"
3. 非 custom provider → 行为不受影响，仍使用 PROVIDER_METADATA 中的 baseUrl
4. 用户在 settings 中修改 custom baseUrl → 下次请求使用新 URL（无需重启）

## 验收要求

- [ ] Custom provider 动态读取 `openModel.custom.baseUrl` 配置
- [ ] Custom provider 动态读取 `openModel.custom.vendorName` 配置
- [ ] 非 custom provider 行为不受影响
- [ ] baseUrl 未配置时有明确错误提示
- [ ] `npm run compile` 通过
