# T038 - 定义 /v1/models API 响应类型

**优先级:** P3 - 自动模型发现
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/types.ts` — 新增 API 响应相关的类型定义

### 具体变更

在 `src/types.ts` 中新增：

```ts
/** 单个从 /v1/models 端点返回的模型信息 */
export interface FetchedModel {
  id: string;
  object: string;
  owned_by?: string;
}

/** /v1/models 端点的完整响应结构 */
export interface ModelsApiResponse {
  object: string;
  data: FetchedModel[];
}
```

## 边界条件

- `id` 为模型唯一标识，必须存在
- `object` 通常为 `"model"`，但不做强制校验
- `owned_by` 为可选字段，部分 API 可能不返回
- 类型定义不依赖任何 VS Code API

## 测试用例

1. `FetchedModel` 对象可以只包含 `id` 和 `object` 两个字段
2. `owned_by` 可选
3. `ModelsApiResponse` 的 `data` 字段为 `FetchedModel[]` 类型

## 验收要求

- [ ] `src/types.ts` 中新增 `FetchedModel` 和 `ModelsApiResponse` 接口
- [ ] 两个接口均已 export
- [ ] `npm run compile` 通过
