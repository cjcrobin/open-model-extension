# T032 - 添加状态栏 Provider 指示器

**优先级:** P5 - UX 增强
**依赖:** T001 (PROVIDER_NAMES 集中定义)

## 需要修改/增加的内容

### 新增文件

- `src/ui/statusBar.ts` — 状态栏项的创建和更新逻辑

### 修改文件

- `src/extension.ts` — 初始化状态栏项并注册到 subscriptions

### 具体变更

1. 新建 `src/ui/statusBar.ts`：
   ```ts
   import * as vscode from 'vscode';
   import { ProviderName, PROVIDER_METADATA, PROVIDER_NAMES } from '../types';

   export function createStatusBarItem(): vscode.StatusBarItem {
     const item = vscode.window.createStatusBarItem(
       vscode.StatusBarAlignment.Right,
       100
     );
     item.name = 'Open Model';
     updateStatusBar(item);
     item.command = 'openModel.configure';
     item.tooltip = 'Open Model: Click to configure providers';
     item.show();
     return item;
   }

   export function updateStatusBar(item: vscode.StatusBarItem): void {
     const enabled: string[] = [];
     for (const name of PROVIDER_NAMES) {
       const isEnabled = vscode.workspace
         .getConfiguration(`openModel.${name}`)
         .get<boolean>('enabled', false);
       if (isEnabled) {
         enabled.push(PROVIDER_METADATA[name].displayName);
       }
     }

     if (enabled.length === 0) {
       item.text = '$(circle-slash) Open Model';
       item.backgroundColor = undefined;
     } else {
       item.text = `$(sparkle) ${enabled.join(', ')}`;
       item.backgroundColor = undefined;
     }
   }
   ```

## 边界条件

- 状态栏项对齐方式为 `Right`，优先级 100
- 无 provider 启用时显示 `$(circle-slash) Open Model`
- 有 provider 启用时显示 `$(sparkle) Provider1, Provider2`
- 过长文本（>50 字符）应截断显示，如 `Kimi, DeepSeek, +2 more`
- 点击状态栏项触发 `openModel.configure` 命令
- 配置变更时需调用 `updateStatusBar` 刷新显示

## 测试用例

1. 无 provider 启用 → 显示 `$(circle-slash) Open Model`
2. 仅启用 DeepSeek → 显示 `$(sparkle) DeepSeek`
3. 启用全部 4 个 → 显示所有名称或截断
4. 点击状态栏项 → 打开 Open Model 设置页
5. 配置变更后 → 状态栏自动更新

## 验收要求

- [ ] 状态栏项在扩展激活时显示
- [ ] 显示已启用 provider 列表
- [ ] 点击触发配置命令
- [ ] 配置变更时自动刷新
- [ ] `npm run compile` 通过
