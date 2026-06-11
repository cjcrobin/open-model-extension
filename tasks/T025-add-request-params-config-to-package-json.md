# T025 - 将 RequestParams 配置项注册到 package.json

**优先级:** P4 - 高级请求参数
**依赖:** T004 (RequestParams 接口已定义)

## 需要修改/增加的内容

### 修改文件

- `package.json` — 为每个 provider 添加 `requestParams` 配置项

### 具体变更

在 `contributes.configuration.properties` 中为每个 provider 添加：

```json
"openModel.kimi.requestParams": {
  "type": "object",
  "default": {},
  "properties": {
    "temperature": { "type": "number", "minimum": 0, "maximum": 2, "description": "Sampling temperature" },
    "topP": { "type": "number", "minimum": 0, "maximum": 1, "description": "Nucleus sampling parameter" },
    "frequencyPenalty": { "type": "number", "minimum": -2, "maximum": 2, "description": "Frequency penalty" },
    "presencePenalty": { "type": "number", "minimum": -2, "maximum": 2, "description": "Presence penalty" },
    "extra": { "type": "object", "description": "Additional provider-specific parameters" }
  },
  "description": "Advanced request parameters for Kimi models"
}
```

重复 4 次（kimi、deepseek、glm、qwen）+ 1 次（custom）。

## 边界条件

- 默认值为空对象 `{}`，表示不覆盖任何参数
- `temperature` 范围 0-2，`topP` 范围 0-1
- `extra` 为自由格式对象，不做 schema 校验
- 不设置 `stop` 参数（由 Copilot Chat 内部管理）

## 测试用例

1. Settings UI 中出现各 provider 的 "Request Params" 配置项
2. 可设置 `temperature: 0.7` 且无 schema 警告
3. 设置 `temperature: 5`（超范围）→ schema 警告
4. `extra` 字段接受任意 key-value

## 验收要求

- [ ] 五个 provider（kimi、deepseek、glm、qwen、custom）均有 `requestParams` 配置项
- [ ] `temperature`、`topP` 等字段有范围限制
- [ ] `npm run compile` 通过
