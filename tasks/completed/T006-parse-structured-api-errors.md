# T006 - 解析结构化 API 错误响应

**优先级:** P1 - 功能改进
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 修改 `provideLanguageModelChatResponse` 方法中的错误处理逻辑

### 具体变更

将当前的简单错误抛出：
```ts
const errorText = await response.text();
throw new Error(`${displayName} API request failed (${response.status}): ${errorText}`);
```

替换为结构化错误解析：
```ts
const errorText = await response.text();
let errorMessage = errorText;
try {
  const errorJson = JSON.parse(errorText);
  if (errorJson.error?.message) {
    errorMessage = errorJson.error.message;
  }
} catch { /* use raw text as fallback */ }

const prefix = `${displayName} API error ${response.status}`;
throw new Error(`${prefix}: ${errorMessage}`);
```

## 边界条件

- 当 API 返回非 JSON 格式的错误信息时（如 HTML 错误页、纯文本），应回退到原始文本
- 当 JSON 存在但不含 `error.message` 字段时，应回退到原始文本
- 超长错误信息（>500 字符）应截断，避免 VS Code 通知栏溢出
- 确保不吞掉原始 HTTP status code

## 测试用例

1. JSON 错误 `{"error":{"message":"Invalid API key","type":"invalid_request_error"}}` → 错误信息包含 "Invalid API key"
2. 非 JSON 错误 `<html>Server Error</html>` → 回退到原始文本
3. JSON 但无 error.message `{"code":401}` → 回退到原始文本
4. 超长错误文本被截断到 500 字符以内

## 验收要求

- [ ] `npm run compile` 通过
- [ ] 结构化 JSON 错误被正确解析并显示 message 内容
- [ ] 非 JSON 错误回退到原始文本，不抛出解析异常
- [ ] HTTP status code 始终包含在错误信息中
