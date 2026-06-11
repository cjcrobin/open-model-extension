# T007 - 为工具调用 JSON 解析失败添加日志记录

**优先级:** P1 - 功能改进
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 修改 `streamResponse` 方法中 tool call JSON 解析的 catch 块

### 具体变更

需要让 `streamResponse` 方法能够访问 OutputChannel。有两种方式：

**方式 A（推荐）：** 在 `OpenAICompatProvider` 构造函数中增加 `output` 参数：

1. 在 `provider.ts` 的 `OpenAICompatProvider` 类中添加 `private readonly output: vscode.OutputChannel` 字段
2. 修改构造函数签名，增加 `output` 参数
3. 修改 `manager.ts` 中创建 `OpenAICompatProvider` 实例时传入 `output`
4. 在 catch 块中添加日志：

```ts
// 原来的 catch 块:
catch { /* keep empty */ }

// 改为:
catch {
  this.output.appendLine(
    `[${PROVIDER_METADATA[this.providerName].displayName}] ` +
    `Warning: Failed to parse tool call arguments for "${tc.name}": ${tc.args}`
  );
}
```

## 边界条件

- 日志不应中断正常的流式响应流程
- 日志信息应包含 tool name 和原始 args 字符串（方便调试）
- 超长 args 字符串应截断（>200 字符），避免日志膨胀
- OutputChannel 在 Provider 构造时传入，不应创建新的 channel

## 测试用例

1. 正常 tool call（args 为合法 JSON）→ 无额外日志输出
2. args 为非法 JSON `"{incomplete"` → OutputChannel 中出现 Warning 日志
3. 日志包含 tool name 和原始 args 内容

## 验收要求

- [ ] `npm run compile` 通过
- [ ] `OpenAICompatProvider` 构造函数接收 `OutputChannel` 参数
- [ ] `manager.ts` 中创建 provider 时传入已有的 `output` channel
- [ ] tool call JSON 解析失败时在 OutputChannel 输出 Warning
