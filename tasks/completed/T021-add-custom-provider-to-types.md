# T021 - 在 types.ts 中注册 Custom Provider 元数据

**优先级:** P3 - 自定义端点
**依赖:** T001 (PROVIDER_NAMES 集中定义), T020 (package.json 已注册 custom provider)

## 需要修改/增加的内容

### 修改文件

- `src/types.ts` — 扩展 `ProviderName` 类型、`PROVIDER_NAMES` 数组和 `PROVIDER_METADATA` 映射

### 具体变更

1. 扩展 `ProviderName` 联合类型：
   ```ts
   export type ProviderName = 'kimi' | 'deepseek' | 'glm' | 'qwen' | 'custom';
   ```

2. 更新 `PROVIDER_NAMES` 数组：
   ```ts
   export const PROVIDER_NAMES: readonly ProviderName[] = ['kimi', 'deepseek', 'glm', 'qwen', 'custom'];
   ```

3. 在 `PROVIDER_METADATA` 中添加 custom 条目：
   ```ts
   custom: {
     displayName: 'Custom',
     baseUrl: '', // 由用户配置，运行时从 settings 读取
   },
   ```

## 边界条件

- Custom provider 的 `baseUrl` 在 `PROVIDER_METADATA` 中为空字符串占位
- 实际使用时，需从 `vscode.workspace.getConfiguration('openModel.custom').get<string>('baseUrl')` 读取
- `displayName` 也应从用户配置 `openModel.custom.vendorName` 动态读取，此处为 fallback 默认值
- 所有使用 `PROVIDER_METADATA` 的地方需兼容 custom provider（baseUrl 可能为空）

## 测试用例

1. `PROVIDER_NAMES` 包含 `'custom'`
2. `PROVIDER_METADATA['custom']` 存在且有 `displayName` 和 `baseUrl` 字段
3. `ProviderName` 类型接受 `'custom'` 值

## 验收要求

- [ ] `ProviderName` 联合类型包含 `'custom'`
- [ ] `PROVIDER_NAMES` 数组包含 `'custom'`
- [ ] `PROVIDER_METADATA` 包含 `custom` 条目
- [ ] `npm run compile` 通过
