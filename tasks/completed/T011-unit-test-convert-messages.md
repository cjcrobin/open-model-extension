# T011 - 为 convertMessages 函数编写单元测试

**优先级:** P1 - 测试覆盖
**依赖:** T001 (PROVIDER_NAMES 已集中到 types.ts)

## 需要修改/增加的内容

### 新增文件

- `src/test/convertMessages.test.ts` — convertMessages 函数的单元测试文件

### 修改文件

- `src/provider.ts` — 将 `convertMessages` 函数从 `private` 改为 `export`，使其可被测试导入
- `package.json` — 添加 `@vscode/test-electron`、`mocha`、`@types/mocha` 等测试依赖（如尚未安装）

### 具体变更

1. 在 `provider.ts` 中将 `function convertMessages` 改为 `export function convertMessages`
2. 创建测试文件，覆盖所有消息类型转换场景

## 边界条件

- 测试需 mock `vscode` 模块中的 `LanguageModelChatMessageRole`、`LanguageModelTextPart`、`LanguageModelToolCallPart`、`LanguageModelToolResultPart` 等类
- 测试框架可使用 `mocha` + `assert`（VS Code 扩展标准方案），也可用 `vitest`（需额外配置）

## 测试用例

1. **User 文本消息** → 转换为 `{ role: 'user', content: '...' }`
2. **Assistant 文本消息** → 转换为 `{ role: 'assistant', content: '...' }`
3. **System 消息** → 转换为 `{ role: 'system', content: '...' }`
4. **包含 ToolCall 的 Assistant 消息** → 转换为含 `tool_calls` 数组的消息
5. **包含 ToolResult 的消息** → 转换为独立的 `{ role: 'tool', tool_call_id: '...' }` 消息
6. **混合内容消息（Text + ToolCall）** → Text 作为 assistant content，ToolCall 作为 tool_calls
7. **空消息数组** → 返回空数组
8. **多个 TextPart 合并** → content 为拼接后的字符串

## 验收要求

- [ ] 测试文件位于 `src/test/convertMessages.test.ts`
- [ ] 所有 8 个测试用例通过
- [ ] `npm run compile` 通过
- [ ] `convertMessages` 函数在 `provider.ts` 中已导出
