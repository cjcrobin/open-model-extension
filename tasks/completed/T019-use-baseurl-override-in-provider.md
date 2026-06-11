# T019 - 在 Provider 请求中使用 baseUrlOverride

**优先级:** P3 - 自定义端点
**依赖:** T002 (ModelConfig 中已有 baseUrlOverride 字段), T009 (package.json 已注册 baseUrlOverride 配置)

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 修改 `provideLanguageModelChatResponse` 方法，使用模型级别的 `baseUrlOverride`

### 具体变更

在 `provideLanguageModelChatResponse` 方法中，将固定使用 `PROVIDER_METADATA[this.providerName].baseUrl` 替换为优先读取模型配置的 `baseUrlOverride`：

```ts
// 原来的:
const { baseUrl, displayName } = PROVIDER_METADATA[this.providerName];

// 改为:
const modelConfig = this.getModels().find((m) => m.id === model.id);
const baseUrl = modelConfig?.baseUrlOverride?.trim() || PROVIDER_METADATA[this.providerName].baseUrl;
const displayName = PROVIDER_METADATA[this.providerName].displayName;
```

注意：`modelConfig` 变量在后续构建 `requestBody` 时已使用，需确保不重复查找。

## 边界条件

- `baseUrlOverride` 为空字符串或仅含空白时，回退到默认 baseUrl
- `baseUrlOverride` 末尾不应有 `/`（由消费方 trim 处理，不做额外规范化）
- 不影响错误消息中的 displayName 引用

## 测试用例

1. 模型配置了 `baseUrlOverride: "https://proxy.example.com/v1"` → 请求发往 proxy URL
2. 模型未配置 `baseUrlOverride` → 请求发往 PROVIDER_METADATA 默认 URL
3. `baseUrlOverride: "  "` (空白) → 回退到默认 URL
4. 错误消息中仍正确显示 provider displayName

## 验收要求

- [ ] `provider.ts` 中 fetch 请求使用 `baseUrlOverride` 优先
- [ ] 空字符串和空白字符串正确回退
- [ ] `npm run compile` 通过
