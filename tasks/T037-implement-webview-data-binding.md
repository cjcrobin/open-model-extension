# T037 - 实现 WebView 配置面板数据绑定和交互

**优先级:** P6 - WebView 配置面板
**依赖:** T036 (WebView 面板骨架已创建)

## 需要修改/增加的内容

### 修改文件

- `src/webview/configPanel.ts` — 实现 WebView 与 Extension 之间的消息通信和数据绑定

### 新增文件

- `media/configPanel.js` — WebView 端的 JavaScript 逻辑
- `media/configPanel.css` — WebView 端的样式

### 具体变更

1. 在 `configPanel.ts` 中实现消息处理：
   ```ts
   // 在 constructor 中添加消息监听
   this.panel.webview.onDidReceiveMessage(
     async (message) => {
       switch (message.command) {
         case 'getProviders':
           // 读取当前所有 provider 配置并发送回 WebView
           const providerData = this.getProviderData();
           this.panel.webview.postMessage({ command: 'providerData', data: providerData });
           break;
         case 'toggleProvider':
           // 切换 provider 的 enabled 状态
           await this.toggleProvider(message.provider, message.enabled);
           break;
         case 'updateModel':
           // 更新模型配置
           await this.updateModel(message.provider, message.model);
           break;
         case 'addModel':
           // 添加新模型
           await this.addModel(message.provider, message.model);
           break;
         case 'removeModel':
           // 移除模型
           await this.removeModel(message.provider, message.modelId);
           break;
       }
     },
     null,
     this.disposables
   );
   ```

2. 实现辅助方法：
   ```ts
   private getProviderData(): object { /* 读取所有 provider 配置 */ }
   private async toggleProvider(name: string, enabled: boolean): Promise<void> { /* ... */ }
   private async updateModel(provider: string, model: ModelConfig): Promise<void> { /* ... */ }
   private async addModel(provider: string, model: ModelConfig): Promise<void> { /* ... */ }
   private async removeModel(provider: string, modelId: string): Promise<void> { /* ... */ }
   ```

3. 在 `media/configPanel.js` 中实现前端交互逻辑（开关、增删模型、表单）
4. 在 `media/configPanel.css` 中使用 VS Code CSS 变量适配主题

## 边界条件

- WebView 通过 `postMessage` 与 Extension 通信，不直接访问 VS Code API
- 所有配置变更写入 `vscode.ConfigurationTarget.Global`
- 配置变更后自动触发 `onDidChangeConfiguration` → `notifyAll`
- WebView HTML 使用 `nonce` 防止 XSS（Content Security Policy）
- CSS 使用 VS Code CSS 变量（如 `var(--vscode-editor-background)`）适配深色/浅色主题

## 测试用例

1. WebView 加载后自动获取并显示所有 provider 数据
2. 切换 provider 开关 → 配置更新 → 状态同步
3. 添加新模型 → 模型出现在列表中
4. 移除模型 → 模型从列表消失
5. 编辑模型参数 → 配置正确更新
6. 深色/浅色主题下 WebView 样式正确

## 验收要求

- [ ] WebView 正确显示所有 provider 及其模型列表
- [ ] 开关、增删、编辑操作正确更新配置
- [ ] 配置变更触发 Copilot 模型列表刷新
- [ ] WebView 样式适配 VS Code 主题
- [ ] `npm run compile` 通过
