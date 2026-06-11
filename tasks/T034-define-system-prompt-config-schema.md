# T034 - 定义系统提示词模板配置 Schema

**优先级:** P5 - 系统提示词
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `package.json` — 添加系统提示词模板的配置项

### 具体变更

在 `contributes.configuration.properties` 中添加：

```json
"openModel.systemPrompts": {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "description": "Unique identifier for this prompt template" },
      "name": { "type": "string", "description": "Display name for the template" },
      "content": { "type": "string", "description": "The system prompt text" },
      "providers": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Provider names this template applies to (empty = all providers)"
      },
      "modelIds": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Model IDs this template applies to (empty = all models)"
      }
    },
    "required": ["id", "name", "content"]
  },
  "default": [
    {
      "id": "coding-assistant",
      "name": "Coding Assistant",
      "content": "You are an expert software engineer. Provide concise, accurate, and well-structured code solutions.",
      "providers": [],
      "modelIds": []
    },
    {
      "id": "reasoning",
      "name": "Reasoning Mode",
      "content": "Think step by step before providing your answer. Show your reasoning process clearly.",
      "providers": ["deepseek", "qwen"],
      "modelIds": ["deepseek-reasoner", "qwq-32b"]
    }
  ],
  "description": "Custom system prompt templates that are prepended to conversations"
},
"openModel.activeSystemPrompt": {
  "type": "string",
  "default": "",
  "description": "ID of the currently active system prompt template (empty = no system prompt)"
}
```

## 边界条件

- `providers` 为空数组表示适用于所有 provider
- `modelIds` 为空数组表示适用于所有 model
- `activeSystemPrompt` 为空字符串表示不注入任何 system prompt
- 模板内容不做长度限制（由用户自行控制）
- 默认提供两个常用模板作为示例

## 测试用例

1. Settings UI 中出现 System Prompts 配置区域
2. 默认配置包含 2 个预定义模板
3. `activeSystemPrompt` 默认为空字符串
4. 可添加自定义模板且无 schema 警告

## 验收要求

- [ ] `package.json` 中注册了 `systemPrompts` 和 `activeSystemPrompt` 配置项
- [ ] 默认配置包含示例模板
- [ ] `npm run compile` 通过
