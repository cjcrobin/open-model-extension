# T042 - 在 package.json 中注册 Refresh Models 命令

**优先级:** P3 - 自动模型发现
**依赖:** 无

## 需要修改/增加的内容

### 修改文件

- `package.json` — 在 `contributes.commands` 中新增命令定义

### 具体变更

在 `package.json` 的 `contributes.commands` 数组中添加：

```json
{
  "command": "openModel.refreshModels",
  "title": "Open Model: Refresh Models from API",
  "category": "Open Model"
}
```

## 边界条件

- 命令 ID 为 `openModel.refreshModels`
- 仅注册命令定义，不实现逻辑（由 T044 处理）
- 不修改其他已有命令

## 测试用例

1. VS Code 命令面板中可搜索到 "Open Model: Refresh Models from API"
2. 点击命令不报错（即使尚未实现 handler）

## 验收要求

- [ ] `package.json` 中 `contributes.commands` 包含 `openModel.refreshModels`
- [ ] `npm run compile` 通过
