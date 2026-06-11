# T031 - 实现配置导入命令

**优先级:** P5 - 配置管理
**依赖:** T030 (导出命令已实现，确保导入格式与导出一致)

## 需要修改/增加的内容

### 新增文件

- `src/commands/importConfig.ts` — 配置导入命令的实现逻辑

### 修改文件

- `package.json` — 注册新命令 `openModel.importConfig`
- `src/extension.ts` — 导入并注册导入命令

### 具体变更

1. 在 `package.json` 的 `contributes.commands` 中添加：
   ```json
   {
     "command": "openModel.importConfig",
     "title": "Open Model: Import Configuration",
     "category": "Open Model"
   }
   ```

2. 新建 `src/commands/importConfig.ts`：
   ```ts
   import * as vscode from 'vscode';

   export async function importConfigCommand(): Promise<void> {
     const uris = await vscode.window.showOpenDialog({
       canSelectMany: false,
       filters: { 'JSON Files': ['json'] },
       title: 'Select Open Model configuration file',
     });

     if (!uris || uris.length === 0) return;

     const content = await vscode.workspace.fs.readFile(uris[0]);
     const data = JSON.parse(Buffer.from(content).toString('utf-8'));

     // 确认导入
     const confirm = await vscode.window.showWarningMessage(
       'This will overwrite your current Open Model configuration. Continue?',
       { modal: true },
       'Import'
     );

     if (confirm !== 'Import') return;

     const config = vscode.workspace.getConfiguration('openModel');
     const target = vscode.ConfigurationTarget.Global;

     for (const [key, value] of Object.entries(data)) {
       await config.update(key, value, target);
     }

     vscode.window.showInformationMessage('Open Model: Configuration imported successfully.');
   }
   ```

## 边界条件

- 导入前显示确认对话框（modal warning），防止误操作覆盖配置
- JSON 解析失败时显示友好错误信息
- 仅导入 `openModel.*` 命名空间下的配置（忽略未知字段）
- 导入写入 `ConfigurationTarget.Global`（用户级设置）
- 取消文件选择对话框时不报错
- 导入后自动触发配置变更事件（由 `onDidChangeConfiguration` 监听器处理）

## 测试用例

1. 命令面板中可找到 "Open Model: Import Configuration"
2. 选择有效 JSON 文件 → 显示确认对话框 → 确认后配置更新
3. 选择无效 JSON → 显示解析错误提示
4. 取消文件选择 → 无操作
5. 确认对话框点取消 → 配置不变

## 验收要求

- [ ] `package.json` 中注册了 `openModel.importConfig` 命令
- [ ] 导入前弹出确认对话框
- [ ] 导入后配置正确更新
- [ ] 无效 JSON 有友好错误提示
- [ ] `npm run compile` 通过
