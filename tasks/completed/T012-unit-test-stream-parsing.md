# T012 - 为 SSE 流解析逻辑编写单元测试

**优先级:** P1 - 测试覆盖
**依赖:** T005 (token 计数逻辑改进后), T006 (结构化错误解析后)

## 需要修改/增加的内容

### 新增文件

- `src/test/streamParsing.test.ts` — SSE 流解析逻辑的单元测试文件

### 修改文件

- `src/provider.ts` — 将流解析核心逻辑抽取为可独立测试的纯函数（如 `parseSSELine`、`parseChunk`），与 VS Code API 解耦

### 具体变更

1. 在 `provider.ts` 中抽取纯函数：
   ```ts
   export function parseSSELine(line: string): ChatCompletionChunk | null {
     const trimmed = line.trim();
     if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data: ')) {
       return null;
     }
     return JSON.parse(trimmed.slice('data: '.length));
   }
   ```
2. 创建测试文件，覆盖各种 SSE 流数据格式

## 边界条件

- 纯函数测试，不需要 mock `ReadableStream` 或 VS Code API
- `parseSSELine` 对非法 JSON 应抛异常（由调用方 catch），测试中应覆盖此场景
- 测试不依赖 `streamResponse` 方法的完整流程

## 测试用例

1. **标准 SSE 行** `data: {"choices":[{"delta":{"content":"hello"}}]}` → 正确解析为 chunk 对象
2. **空行** → 返回 `null`
3. **data: [DONE]** → 返回 `null`
4. **非 data 前缀行** `event: ping` → 返回 `null`
5. **非法 JSON** `data: {invalid` → 抛出 SyntaxError
6. **reasoning_content** `data: {"choices":[{"delta":{"reasoning_content":"thinking..."}}]}` → 正确解析
7. **tool_calls 流式分片** → 多个 chunk 的 tool_calls 能被正确累积
8. **finish_reason: "tool_calls"** → 正确识别 finish_reason

## 验收要求

- [ ] 测试文件位于 `src/test/streamParsing.test.ts`
- [ ] 所有 8 个测试用例通过
- [ ] `parseSSELine` 纯函数已从 `provider.ts` 中导出
- [ ] `npm run compile` 通过
