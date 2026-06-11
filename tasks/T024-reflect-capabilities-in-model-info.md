# T024 - 在 toModelInfo 中反映模型能力标记

**优先级:** P3 - 模型能力
**依赖:** T003 (ModelConfig 已定义能力标记字段), T023 (默认模型已添加能力标记)

## 需要修改/增加的内容

### 修改文件

- `src/provider.ts` — 修改 `toModelInfo` 方法，将 `ModelConfig` 的能力标记映射到 VS Code 的 `capabilities`

### 具体变更

修改 `toModelInfo` 方法：

```ts
private toModelInfo(m: ModelConfig): vscode.LanguageModelChatInformation {
  const { displayName } = PROVIDER_METADATA[this.providerName];
  return {
    id: m.id,
    name: m.name,
    family: displayName,
    version: m.id,
    maxInputTokens: m.maxInputTokens ?? 65536,
    maxOutputTokens: m.maxOutputTokens ?? 8192,
    capabilities: {
      toolCalling: true,
      // 根据 ModelConfig 的能力标记设置
      ...(m.supportsVision ? { imageInput: true } : {}),
    },
  };
}
```

注意：VS Code `LanguageModelChatInformation.capabilities` 的类型定义可能有限，需检查 `@types/vscode` 中支持哪些 capability 字段。对于 `supportsReasoning`，当前 VS Code API 可能没有直接对应的 capability，可在模型 name 中添加标识（如 "[Reasoning]" 后缀）。

### 对于不支持的 capability 字段的处理

如果 VS Code API 不支持某个 capability：
- `supportsReasoning`: 在模型 `name` 后追加 " (Reasoning)" 后缀作为 UI 标识
- `supportsVision`: 如果 API 支持 `imageInput` capability 则设置，否则同样在 name 后追加 " (Vision)"

## 边界条件

- 仅当 `supportsVision === true` 时设置 `imageInput` capability
- 仅当 `supportsReasoning === true` 时追加 "(Reasoning)" 后缀
- `supportsVision` 和 `supportsReasoning` 未设置或为 false 时不改变行为
- 不破坏已有的 `toolCalling: true` 设置

## 测试用例

1. `supportsVision: true` 的模型 → capabilities 包含 `imageInput: true`
2. `supportsReasoning: true` 的模型 → name 包含 "(Reasoning)"
3. 两个都未设置 → 仅 `toolCalling: true`，name 不变
4. 两个都为 true → 同时设置 imageInput 和追加 Reasoning 后缀

## 验收要求

- [ ] `toModelInfo` 读取 `ModelConfig` 的 `supportsVision` 和 `supportsReasoning`
- [ ] Vision 能力正确映射到 VS Code capabilities
- [ ] Reasoning 模型在 UI 中有视觉标识
- [ ] `npm run compile` 通过
