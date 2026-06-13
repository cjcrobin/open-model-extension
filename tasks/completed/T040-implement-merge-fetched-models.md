# T040 - 实现 mergeFetchedModels 数据合并函数

**优先级:** P3 - 自动模型发现
**依赖:** T038 (API 响应类型已定义)

## 需要修改/增加的内容

### 新增文件

- `src/utils/mergeModels.ts` — 将从 API 获取的模型列表与用户现有配置合并

### 具体变更

新建 `src/utils/mergeModels.ts`：

```ts
import { ModelConfig, FetchedModel } from '../types';

/**
 * Merge fetchedModel list with existing ModelConfig list.
 * Strategy:
 * - Existing models (by id): keep user's config entry unchanged (preserve overrides, token limits, etc.)
 * - New models from API: add with `id` and `name` (= id) as defaults
 * - Existing models not in API response: keep them (might be temporarily unavailable)
 */
export function mergeFetchedModels(
  fetched: FetchedModel[],
  existing: ModelConfig[]
): ModelConfig[] {
  const existingIds = new Set(existing.map((m) => m.id));
  const existingMap = new Map(existing.map((m) => [m.id, m]));

  const merged: ModelConfig[] = [];

  for (const fm of fetched) {
    if (existingMap.has(fm.id)) {
      merged.push(existingMap.get(fm.id)!);
    } else {
      merged.push({ id: fm.id, name: fm.id });
    }
  }

  // Keep existing models that are not in the API response
  for (const em of existing) {
    if (!fetched.some((fm) => fm.id === em.id)) {
      merged.push(em);
    }
  }

  return merged;
}
```

## 边界条件

- 已存在的模型（按 `id` 匹配）完全保留用户配置，不做任何覆盖
- API 中新增的模型以 `id` 同时作为 `name` 的默认值
- 用户配置中存在但 API 未返回的模型保留（可能是暂时下线）
- `fetched` 为空数组时返回 `existing` 不变
- `existing` 为空数组时返回 `fetched` 映射后的结果

## 测试用例

1. `fetched` 含新模型 + `existing` 含旧模型 → 合并后两者都存在
2. `existing` 中某模型有 `baseUrlOverride` → 合并后该字段保留
3. `fetched` 不含某 `existing` 模型的 id → 该模型仍出现在结果中
4. `fetched` 为空数组 → 返回 `existing` 原样
5. `existing` 为空数组 → 返回 `fetched` 映射为 `ModelConfig`
6. 重复 id 不会出现在结果中

## 验收要求

- [ ] `src/utils/mergeModels.ts` 存在并导出 `mergeFetchedModels` 函数
- [ ] 用户已有的自定义配置（baseUrlOverride、supportsVision 等）不被覆盖
- [ ] API 中的新模型正确添加
- [ ] `npm run compile` 通过
