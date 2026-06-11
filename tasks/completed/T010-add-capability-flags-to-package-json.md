# T010 - 将模型能力标记注册到 package.json 配置 schema

**优先级:** P2 - 功能改进
**依赖:** T003 (ModelConfig 中已定义 supportsVision / supportsReasoning 字段)

## 需要修改/增加的内容

### 修改文件

- `package.json` — 在四个 provider 的 models items schema 中增加能力标记属性

### 具体变更

在每个 provider 的 `models.items.properties` 中追加：
```json
"supportsVision": {
  "type": "boolean",
  "default": false,
  "description": "Whether this model supports image/vision input"
},
"supportsReasoning": {
  "type": "boolean",
  "default": false,
  "description": "Whether this model outputs reasoning/thinking tokens (e.g. DeepSeek R1, QwQ)"
}
```

需修改的位置（共 4 处）：
1. `openModel.kimi.models.items.properties`
2. `openModel.deepseek.models.items.properties`
3. `openModel.glm.models.items.properties`
4. `openModel.qwen.models.items.properties`

### 额外变更

在默认模型配置中为已知的 reasoning 模型设置 `supportsReasoning: true`：
- `deepseek-reasoner` (DeepSeek R1)
- `qwq-32b` (QwQ)

## 边界条件

- 两个字段均为可选，`default` 为 `false`
- 不出现在 `required` 数组中
- 仅对已知 reasoning 模型在默认配置中预设 `true`，其他模型保持默认 `false`
- 不修改 `toModelInfo` 的消费逻辑（由后续任务处理）

## 测试用例

1. VS Code Settings UI 中显示 "Supports Vision" 和 "Supports Reasoning" 开关
2. 默认配置中 `deepseek-reasoner` 的 `supportsReasoning` 为 `true`
3. 默认配置中 `deepseek-v4-flash` 的 `supportsReasoning` 未设置或为 `false`

## 验收要求

- [ ] 四个 provider 的 models items schema 均包含 `supportsVision` 和 `supportsReasoning` 属性
- [ ] 默认模型中 `deepseek-reasoner` 和 `qwq-32b` 标记了 `supportsReasoning: true`
- [ ] `npm run compile` 通过
