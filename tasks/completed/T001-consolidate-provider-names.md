# T001 - 将 PROVIDER_NAMES 常量集中定义到 types.ts

**优先级:** P0 - 基础重构
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/types.ts` — 新增 `PROVIDER_NAMES` 常量导出
- `src/extension.ts` — 删除本地 `PROVIDER_NAMES` 定义，改为从 `./types` 导入
- `src/manager.ts` — 删除本地 `PROVIDER_NAMES` 定义，改为从 `./types` 导入

### 具体变更

1. 在 `src/types.ts` 中，在 `ProviderName` 类型定义之后新增：
   ```ts
   export const PROVIDER_NAMES: ProviderName[] = ['kimi', 'deepseek', 'glm', 'qwen'];
   ```
2. 在 `src/extension.ts` 第 3 行的 import 中增加 `PROVIDER_NAMES`，删除第 5 行的本地定义
3. 在 `src/manager.ts` 第 2 行的 import 中增加 `PROVIDER_NAMES`，删除第 5 行的本地定义

## 边界条件

- `PROVIDER_NAMES` 必须是 `readonly` 或 `as const` 的数组，防止运行时被意外修改
- 导出类型为 `readonly ProviderName[]` 即可，下游代码只需读取
- 确保 `ProviderName` 联合类型与 `PROVIDER_NAMES` 数组内容保持同步

## 测试用例

1. 编译测试：`npm run compile` 无 TypeScript 编译错误
2. 导入验证：`extension.ts` 和 `manager.ts` 中不再包含 `PROVIDER_NAMES` 的本地定义
3. 运行时验证：`PROVIDER_NAMES` 在运行时包含 `['kimi', 'deepseek', 'glm', 'qwen']`

## 验收要求

- [ ] `npm run compile` 通过，无错误
- [ ] `src/types.ts` 中存在唯一一处 `PROVIDER_NAMES` 定义并 export
- [ ] `src/extension.ts` 和 `src/manager.ts` 中不存在 `PROVIDER_NAMES` 的本地定义
- [ ] 使用 `grep` 确认项目中仅有 `types.ts` 一处定义
