# T013 - 为 Token 计数逻辑编写单元测试

**优先级:** P1 - 测试覆盖
**依赖:** T005 (CJK 感知的 token 计数逻辑已实现)

## 需要修改/增加的内容

### 新增文件

- `src/test/tokenCounting.test.ts` — token 计数逻辑的单元测试文件

### 修改文件

- `src/provider.ts` — 将 token 计数核心逻辑抽取为可独立测试的纯函数

### 具体变更

1. 在 `provider.ts` 中抽取纯函数：
   ```ts
   export function estimateTokenCount(text: string): number {
     let tokens = 0;
     for (const char of text) {
       const code = char.codePointAt(0)!;
       if (
         (code >= 0x4E00 && code <= 0x9FFF) ||
         (code >= 0x3400 && code <= 0x4DBF) ||
         (code >= 0x3040 && code <= 0x309F) ||
         (code >= 0x30A0 && code <= 0x30FF) ||
         (code >= 0xAC00 && code <= 0xD7AF)
       ) {
         tokens += 1.5;
       } else {
         tokens += 0.25;
       }
     }
     return Math.ceil(tokens);
   }
   ```
2. 创建测试文件

## 边界条件

- 纯函数测试，不需要 mock VS Code API
- 空字符串应返回 0
- emoji（如 😀 U+1F600）不属于 CJK 范围，按 0.25 计算
- 超长字符串（>100K 字符）不应有性能问题（< 50ms）

## 测试用例

1. **空字符串** `""` → 返回 `0`
2. **纯英文** `"Hello world"` (11 chars) → 返回 `3`（ceil(11 * 0.25) = 3）
3. **纯中文** `"你好世界"` (4 chars) → 返回 `6`（ceil(4 * 1.5) = 6）
4. **混合文本** `"Hello 你好"` → 英文 6 chars * 0.25 + 空格 1 * 0.25 + 中文 2 * 1.5 = 4.75 → `5`
5. **日文假名** `"こんにちは"` (5 chars) → 返回 `8`（ceil(5 * 1.5) = 8）
6. **韩文** `"안녕하세요"` (5 chars) → 返回 `8`
7. **emoji** `"😀😀😀"` → 非 CJK，按 0.25 计算
8. **超长字符串** (100K 字符纯英文) → 性能可接受（< 50ms）

## 验收要求

- [ ] 测试文件位于 `src/test/tokenCounting.test.ts`
- [ ] 所有 8 个测试用例通过
- [ ] `estimateTokenCount` 纯函数已从 `provider.ts` 中导出
- [ ] `npm run compile` 通过
