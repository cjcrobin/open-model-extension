# T030 - 实现配置导出命令

**优先级:** P5 - 配置管理
**依赖:** 无

## 需要修改/增加的内容

### 新增文件

- `src/commands/exportConfig.ts` — 配置导出命令的实现逻辑

### 修改文件

- `package.json` — 注册新命令 `openModel.exportConfig`
- `src/extension.ts` — 导入并注册导出命令

### 具体变更

1. 在 `package.json` 的 `contributes.commands` 中添加：
   ```json
   {
     "command": "openModel.exportConfig",
     "title": "Open Model: Export Configuration",
     "category": "Open Model"
   }
   ```

2. 新建 `src/commands/exportConfig.ts`：
   ```ts
   import * as vscode from 'vscode';
   import { PROVIDER_NAMES } from '../types';

   export async function exportConfigCommand(): Promise<void> {
     const config = vscode.workspace.getConfiguration('openModel');
     const exportData: Record<string, unknown> = {};

     for (const name of PROVIDER_NAMES) {
       exportData[`${name}.enabled`] = config.get(`${name}.enabled`);
       exportData[`${name}.models`] = config.get(`${name}.models`);
       // 导出其他可导出字段（baseUrl, requestParams 等）
     }

     const doc = JSON.stringify(exportData, null, 2);

     const uri = await vscode.window.showSaveDialog({
       defaultUri: vscode.Uri.file('open-model-config.json'),
       filters: { 'JSON Files': ['json'] },
     });

     if (uri) {
       await vscode.workspace.fs.writeFile(uri, Buffer.from(doc, 'utf-8'));
       vscode.window.showInformationMessage(`Open Model: Configuration exported to ${uri.fsPath}`);
     }
   }
   ```

## 边界条件

- 仅导出非敏感配置（不导出 API key）
- 用户取消保存对话框时不报错
- 导出的 JSON 格式美观（缩进 2 空格）
- 仅导出 `openModel.*` 命名空间下的配置

## 测试用例

1. 命令面板中可找到 "Open Model: Export Configuration"
2. 导出的 JSON 包含所有 provider 的 enabled 和 models 配置
3. 导出的 JSON 不包含任何 API key
4. 取消保存对话框 → 无操作、无错误

## 验收要求

- [ ] `package.json` 中注册了 `openModel.exportConfig` 命令
- [ ] 导出 JSON 格式正确且不含敏感信息
- [ ] `npm run compile` 通过
