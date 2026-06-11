# T005 - 实现 CJK 感知的 Token 计数逻辑

**优先级:** P1 - 功能改进
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 重写 `provideTokenCount` 方法

### 具体变更

将当前简单的 `Math.ceil(str.length / 4)` 替换为 CJK 感知的计数逻辑：

```ts
async provideTokenCount(
  _model: vscode.LanguageModelChatInformation,
  text: string | vscode.LanguageModelChatRequestMessage,
  _token: vscode.CancellationToken
): Promise<number> {
  const str = typeof text === 'string'
    ? text
    : text.content
        .map((p) => (p instanceof vscode.LanguageModelTextPart ? p.value : ''))
        .join('');

  let tokens = 0;
  for (const char of str) {
    const code = char.codePointAt(0)!;
    // CJK Unified Ideographs, CJK Radicals, Hiragana, Katakana, etc.
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||  // CJK Unified
      (code >= 0x3400 && code <= 0x4DBF) ||  // CJK Extension A
      (code >= 0x3040 && code <= 0x309F) ||  // Hiragana
      (code >= 0x30A0 && code <= 0x30FF) ||  // Katakana
      (code >= 0xAC00 && code <= 0xD7AF)     // Hangul
    ) {
      tokens += 1.5;  // CJK characters typically consume more tokens
    } else {
      tokens += 0.25; // ~4 chars per token for Latin text
    }
  }
  return Math.ceil(tokens);
}
```

## 边界条件

- 空字符串返回 0
- 纯英文文本行为与原先近似（约 4 字符 = 1 token）
- 纯中文文本约 1.5 字符 = 1 token（偏保守，实际更接近 1:1）
- 混合文本应给出合理估算
- emoji 和特殊 Unicode 字符不应导致异常

## 测试用例

1. 空字符串 → 返回 0
2. 纯英文 "Hello world" (11 chars) → 约 3 tokens
3. 纯中文 "你好世界" (4 chars) → 约 6 tokens
4. 混合文本 "Hello 你好" → 约 5 tokens
5. 长文本（10000 字符）不应有性能问题

## 验收要求

- [ ] `npm run compile` 通过
- [ ] `provideTokenCount` 对 CJK 字符和 Latin 字符的估算比率不同
- [ ] 无运行时异常（空字符串、emoji、特殊字符）
