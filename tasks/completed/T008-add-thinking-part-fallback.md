# T008 - 为 ThinkingPart 添加 fallback 文本输出

**优先级:** P1 - 功能改进
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 修改 `streamResponse` 方法中 reasoning content 的处理逻辑

### 具体变更

当前逻辑：当 `ThinkingPart` 为 `undefined` 时，reasoning content 被完全丢弃。

修改为：当 `ThinkingPart` 不可用时，将 reasoning content 以普通文本形式输出：

```ts
// 原来的逻辑:
if (delta.reasoning_content) {
  if (ThinkingPart) {
    progress.report(new ThinkingPart(delta.reasoning_content));
    thinkingOpen = true;
  }
}

// 改为:
if (delta.reasoning_content) {
  if (ThinkingPart) {
    progress.report(new ThinkingPart(delta.reasoning_content));
    thinkingOpen = true;
  } else {
    // Fallback: output reasoning as plain text with a marker
    progress.report(new vscode.LanguageModelTextPart(delta.reasoning_content));
  }
}
```

## 边界条件

- 当 `ThinkingPart` 可用时，行为与当前完全一致（使用 collapsible thinking block）
- 当 `ThinkingPart` 不可用时，reasoning 内容作为 `LanguageModelTextPart` 输出，不丢失
- fallback 输出的文本不应与正常回复内容混淆（thinking 结束后正常内容照常输出）
- 不需要在 fallback 模式下追踪 `thinkingOpen` 状态（因为没有需要关闭的 thinking block）

## 测试用例

1. `ThinkingPart` 可用 + reasoning content → 使用 ThinkingPart 渲染
2. `ThinkingPart` 不可用 + reasoning content → 作为 LanguageModelTextPart 输出
3. `ThinkingPart` 不可用 + reasoning content + normal content → 两者都正确输出，顺序正确
4. 无 reasoning content 时 → 行为不变

## 验收要求

- [ ] `npm run compile` 通过
- [ ] 当 `ThinkingPart` 为 undefined 时，reasoning content 不丢失
- [ ] 当 `ThinkingPart` 可用时，行为与改动前完全一致
