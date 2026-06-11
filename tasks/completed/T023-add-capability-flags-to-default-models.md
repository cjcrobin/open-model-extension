# T023 - 在 package.json 默认模型配置中添加能力标记

**优先级:** P3 - 模型能力
**依赖:** T010 (package.json 中已注册 supportsVision / supportsReasoning 字段)

## 需要修改/增加的内容

### 修改文件

- `package.json` — 在默认模型配置中为已知模型添加 `supportsReasoning` 和 `supportsVision` 标记

### 具体变更

在 `openModel.deepseek.models` 默认值中：
```json
{ "id": "deepseek-reasoner", "name": "DeepSeek R1 (Legacy)", "maxInputTokens": 65536, "maxOutputTokens": 32768, "supportsReasoning": true }
```

在 `openModel.qwen.models` 默认值中：
```json
{ "id": "qwq-32b", "name": "QwQ-32B (Reasoning)", "maxInputTokens": 131072, "maxOutputTokens": 32768, "supportsReasoning": true }
```

其他模型保持默认（`supportsReasoning` 和 `supportsVision` 为 false/未设置）。

## 边界条件

- 仅修改已知 reasoning 模型的默认配置，不改变其他模型
- 用户如果已自定义 models 数组，不受此变更影响（VS Code settings merge 机制）
- 不修改 `toModelInfo` 的消费逻辑（由 T024 处理）

## 测试用例

1. 默认配置中 `deepseek-reasoner` 包含 `"supportsReasoning": true`
2. 默认配置中 `qwq-32b` 包含 `"supportsReasoning": true`
3. 默认配置中 `deepseek-v4-flash` 不包含 `supportsReasoning` 字段
4. JSON schema 校验无警告

## 验收要求

- [ ] `deepseek-reasoner` 默认配置包含 `supportsReasoning: true`
- [ ] `qwq-32b` 默认配置包含 `supportsReasoning: true`
- [ ] 其他默认模型不包含此字段
- [ ] `npm run compile` 通过
