# T009 - 将 baseUrlOverride 配置项注册到 package.json

**优先级:** P2 - 功能改进
**依赖:** T002 (ModelConfig 中已定义 baseUrlOverride 字段)

## 需要修改/增加的内容

### 修改文件

- `package.json` — 在四个 provider 的 models items schema 中增加 `baseUrlOverride` 属性

### 具体变更

在每个 provider 的 `models.items.properties` 中追加：
```json
"baseUrlOverride": {
  "type": "string",
  "description": "Override the default API base URL for this model (e.g. for proxy or self-hosted endpoints)"
}
```

需修改的位置（共 4 处）：
1. `openModel.kimi.models.items.properties` — 在 `maxOutputTokens` 之后添加
2. `openModel.deepseek.models.items.properties` — 同上
3. `openModel.glm.models.items.properties` — 同上
4. `openModel.qwen.models.items.properties` — 同上

## 边界条件

- `baseUrlOverride` 为可选字段，不出现在 `required` 数组中
- 不设置 `default` 值（空值表示使用 PROVIDER_METADATA 中的默认 URL）
- 类型限定为 `string`，不做 URL 格式校验（由消费方处理）

## 测试用例

1. VS Code 设置 UI 中显示 "Base URL Override" 输入框
2. 在 settings.json 中为某个 model 设置 `baseUrlOverride` 后无 schema 校验警告
3. 不设置 `baseUrlOverride` 时无 schema 校验警告

## 验收要求

- [ ] 四个 provider 的 models items schema 均包含 `baseUrlOverride` 属性定义
- [ ] `npm run compile` 通过
- [ ] VS Code 扩展加载后，Settings UI 中 model 配置项显示 base URL override 字段
