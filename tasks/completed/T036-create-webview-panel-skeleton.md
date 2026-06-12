# T036 - 创建 WebView 配置面板骨架

**优先级:** P6 - WebView 配置面板
**依赖:** 无

## 需要修改/增加的内容

### 新增文件

- `src/webview/configPanel.ts` — WebView 面板的创建和生命周期管理

### 修改文件

- `package.json` — 注册新命令 `openModel.openConfigPanel`
- `src/extension.ts` — 导入并注册 WebView 命令

### 具体变更

1. 在 `package.json` 的 `contributes.commands` 中添加：
   ```json
   {
     "command": "openModel.openConfigPanel",
     "title": "Open Model: Open Configuration Panel",
     "category": "Open Model"
   }
   ```

2. 新建 `src/webview/configPanel.ts`：
   ```ts
   import * as vscode from 'vscode';

   export class ConfigPanel {
     private static instance: ConfigPanel | undefined;
     private readonly panel: vscode.WebviewPanel;
     private disposables: vscode.Disposable[] = [];

     private constructor(extensionUri: vscode.Uri) {
       this.panel = vscode.window.createWebviewPanel(
         'openModelConfig',
         'Open Model Configuration',
         vscode.ViewColumn.One,
         {
           enableScripts: true,
           retainContextWhenHidden: true,
           localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
         }
       );

       this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
       this.update();
     }

     static show(extensionUri: vscode.Uri): void {
       if (ConfigPanel.instance) {
         ConfigPanel.instance.panel.reveal();
       } else {
         ConfigPanel.instance = new ConfigPanel(extensionUri);
       }
     }

     private update(): void {
       this.panel.webview.html = this.getHtmlContent();
     }

     private getHtmlContent(): string {
       // 返回基础 HTML 骨架，后续任务填充具体内容
       return `<!DOCTYPE html>
       <html lang="en">
       <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>Open Model Configuration</title>
       </head>
       <body>
         <h1>Open Model Configuration</h1>
         <p>Configuration panel placeholder</p>
       </body>
       </html>`;
     }

     dispose(): void {
       ConfigPanel.instance = undefined;
       this.panel.dispose();
       this.disposables.forEach((d) => d.dispose());
       this.disposables = [];
     }
   }
   ```

## 边界条件

- WebView 面板为单例模式，重复打开命令只 reveal 不创建新面板
- `retainContextWhenHidden: true` 确保切换 tab 后状态不丢失
- `enableScripts: true` 允许 WebView 中运行 JavaScript（后续交互需要）
- `localResourceRoots` 限制为 `media/` 目录（用于 CSS/JS 资源）

## 测试用例

1. 命令面板中可找到 "Open Model: Open Configuration Panel"
2. 执行命令 → 打开 WebView 面板
3. 重复执行命令 → 仅 reveal 已有面板
4. 关闭面板后再次执行 → 创建新面板
5. 面板内容正确渲染

## 验收要求

- [ ] `src/webview/configPanel.ts` 存在并导出 `ConfigPanel` 类
- [ ] WebView 面板为单例，不重复创建
- [ ] `npm run compile` 通过
