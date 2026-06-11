# T018 - 添加 API 连通性测试命令

**优先级:** P2 - 错误恢复
**依赖:** T014 (重试逻辑), T015 (友好错误提示)

## 需要修改/增加的内容

### 修改文件

- `package.json` — 注册新命令 `openModel.testConnection`
- `src/extension.ts` — 实现测试连通性的命令处理逻辑

### 具体变更

1. 在 `package.json` 的 `contributes.commands` 数组中添加：
   ```json
   {
     "command": "openModel.testConnection",
     "title": "Open Model: Test Connection",
     "category": "Open Model"
   }
   ```

2. 在 `extension.ts` 中注册命令：
   ```ts
   context.subscriptions.push(
     vscode.commands.registerCommand('openModel.testConnection', async () => {
       const items = PROVIDER_NAMES.map((name) => ({
         label: PROVIDER_METADATA[name].displayName,
         description: name,
       }));

       const pick = await vscode.window.showQuickPick(items, {
         placeHolder: 'Select a provider to test connection',
         title: 'Open Model: Test Connection',
       });

       if (!pick) return;

       const providerName = pick.description as ProviderName;
       const apiKey = manager!.getApiKey(providerName);
       const { baseUrl, displayName } = PROVIDER_METADATA[providerName];

       if (!apiKey) {
         vscode.window.showErrorMessage(
           `${displayName} API key is not configured. Use "Open Model: Set API Key" first.`
         );
         return;
       }

       await vscode.window.withProgress(
         { location: vscode.ProgressLocation.Notification, title: `Testing ${displayName} connection...` },
         async () => {
           try {
             const response = await fetch(`${baseUrl}/models`, {
               headers: { Authorization: `Bearer ${apiKey}` },
             });
             if (response.ok) {
               vscode.window.showInformationMessage(`${displayName}: Connection successful!`);
             } else {
               vscode.window.showErrorMessage(getFriendlyErrorMessage(response.status, displayName, await response.text()));
             }
           } catch (err) {
             vscode.window.showErrorMessage(`${displayName}: Connection failed - ${err}`);
           }
         }
       );
     })
   );
   ```

## 边界条件

- 用户取消 QuickPick 时不执行任何操作
- API key 未配置时显示错误提示，不发送请求
- 网络超时时（默认 10 秒）显示友好错误而非卡死
- 使用 `withProgress` 显示加载状态，避免用户重复点击
- `/models` 端点不适用于所有 provider（某些可能返回 404），可 fallback 为发送极短 completion 请求

## 测试用例

1. 命令面板中可找到 "Open Model: Test Connection"
2. 未配置 key 时选择 provider → 显示错误提示
3. 有效 key + 正常服务 → 显示 "Connection successful!"
4. 无效 key → 显示 401 友好错误信息
5. 网络不通 → 超时后显示连接失败

## 验收要求

- [ ] `package.json` 中注册了 `openModel.testConnection` 命令
- [ ] 测试成功时显示绿色通知
- [ ] 测试失败时显示红色错误通知并包含友好信息
- [ ] 使用 `withProgress` 显示加载状态
- [ ] `npm run compile` 通过
