# T020 - 注册 Custom Provider 的配置 Schema 到 package.json

**优先级:** P3 - 自定义端点
**依赖:** T009 (已理解 package.json 配置 schema 结构)

## 需要修改/增加的内容

### 修改文件

- `package.json` — 新增 custom provider 相关的配置项和语言模型注册

### 具体变更

1. 在 `contributes.languageModelChatProviders` 数组中添加：
   ```json
   { "vendor": "custom", "displayName": "Custom (OpenAI Compatible)" }
   ```

2. 在 `contributes.configuration.properties` 中添加：
   ```json
   "openModel.custom.enabled": {
     "type": "boolean",
     "default": false,
     "description": "Enable custom OpenAI-compatible provider"
   },
   "openModel.custom.baseUrl": {
     "type": "string",
     "default": "",
     "description": "Base URL for the custom provider's API (e.g. http://localhost:11434/v1 for Ollama)"
   },
   "openModel.custom.vendorName": {
     "type": "string",
     "default": "Custom",
     "description": "Display name for the custom provider"
   },
   "openModel.custom.models": {
     "type": "array",
     "items": {
       "type": "object",
       "properties": {
         "id": { "type": "string", "description": "Model ID" },
         "name": { "type": "string", "description": "Display name" },
         "maxInputTokens": { "type": "number", "description": "Max input tokens" },
         "maxOutputTokens": { "type": "number", "description": "Max output tokens" }
       },
       "required": ["id", "name"]
     },
     "default": [],
     "description": "List of models for the custom provider"
   }
   ```

3. 在 `contributes.commands` 中无需新增命令（复用 `openModel.setApiKey`，将 'custom' 加入 PROVIDER_NAMES）

## 边界条件

- `custom.baseUrl` 默认为空字符串，未配置时应提示用户填写
- `custom.models` 默认为空数组，不注册任何模型直到用户配置
- `custom.vendorName` 用于 UI 显示，默认为 "Custom"
- Custom provider 不预设任何默认模型

## 测试用例

1. Settings UI 中出现 "Custom (OpenAI Compatible)" 相关配置项
2. 可配置 `openModel.custom.baseUrl`、`openModel.custom.vendorName`、`openModel.custom.models`
3. `openModel.custom.enabled` 默认为 false
4. models 数组默认为空

## 验收要求

- [ ] `package.json` 中注册了 custom vendor 和相关配置项
- [ ] VS Code Settings UI 中显示 custom provider 配置面板
- [ ] `npm run compile` 通过
