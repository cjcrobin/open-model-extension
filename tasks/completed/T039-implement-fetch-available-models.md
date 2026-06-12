# T039 - 实现 fetchAvailableModels HTTP 请求函数

**优先级:** P3 - 自动模型发现
**依赖:** T038 (API 响应类型已定义)

## 需要修改/增加的内容

### 新增文件

- `src/utils/fetchModels.ts` — 从 /v1/models 端点获取可用模型列表

### 具体变更

新建 `src/utils/fetchModels.ts`：

```ts
import { ModelsApiResponse } from '../types';

/**
 * Fetch available models from a provider's /v1/models endpoint.
 * Returns parsed FetchedModel array on success.
 * Throws on HTTP error or invalid response.
 */
export async function fetchAvailableModels(
  baseUrl: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ModelsApiResponse> {
  const url = `${baseUrl.replace(/\/+$/, '')}/models`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: HTTP ${response.status}`);
  }

  return response.json() as Promise<ModelsApiResponse>;
}
```

## 边界条件

- `baseUrl` 末尾的 `/` 应在拼接前去除（避免 `//models`）
- 超时由调用方通过 `AbortSignal` 控制，本函数不设超时
- HTTP 非 2xx 响应应抛出包含 status code 的错误
- JSON 解析失败时由 fetch 的 `.json()` 自然抛出异常
- 不依赖 VS Code API，纯 HTTP 函数

## 测试用例

1. 正常 API 响应 → 返回 `ModelsApiResponse` 对象
2. baseUrl 末尾带 `/` → 拼接正确，不发往 `//models`
3. HTTP 401 → 抛出包含 "401" 的错误
4. HTTP 500 → 抛出包含 "500" 的错误
5. AbortSignal 取消 → 抛出 AbortError

## 验收要求

- [ ] `src/utils/fetchModels.ts` 存在并导出 `fetchAvailableModels` 函数
- [ ] 函数接受 `baseUrl`、`apiKey`、可选 `signal` 三个参数
- [ ] HTTP 错误时抛出含 status code 的错误
- [ ] `npm run compile` 通过
