# T002 - 为 ModelConfig 接口添加 baseUrlOverride 可选字段

**优先级:** P0 - 基础重构
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/types.ts` — 在 `ModelConfig` 接口中新增 `baseUrlOverride` 字段

### 具体变更

在 `ModelConfig` 接口中添加：
```ts
export interface ModelConfig {
  id: string;
  name: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  /** Override the default base URL for this specific model */
  baseUrlOverride?: string;
}
```

## 边界条件

- `baseUrlOverride` 为可选字段（`?:`），不影响现有配置的兼容性
- 当值为 `undefined` 或空字符串时，应回退到 `PROVIDER_METADATA` 中的默认 `baseUrl`
- URL 格式应在后续消费时校验（本任务仅定义类型，不做校验）

## 测试用例

1. 类型兼容性：现有不含 `baseUrlOverride` 的 `ModelConfig` 对象仍然类型合法
2. 含 `baseUrlOverride` 的对象也类型合法：
   ```ts
   const m: ModelConfig = { id: 'test', name: 'Test', baseUrlOverride: 'https://proxy.example.com/v1' };
   ```

## 验收要求

- [ ] `npm run compile` 通过，无类型错误
- [ ] `ModelConfig` 接口包含 `baseUrlOverride?: string` 字段
- [ ] 现有配置对象（package.json 中 defaults）无需修改即可正常工作
