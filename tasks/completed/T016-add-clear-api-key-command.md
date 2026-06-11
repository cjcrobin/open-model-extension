# T016 - 添加清除 API Key 命令

**优先级:** P2 - API Key 管理
**依赖:** T001 (PROVIDER_NAMES 集中定义)

## 需要修改/增加的内容

### 修改文件

- `package.json` — 注册新命令 `openModel.clearApiKey`
- `src/extension.ts` — 实现清除 API Key 的命令处理逻辑

### 具体变更

1. 在 `package.json` 的 `contributes.commands` 数组中添加：
   ```json
   {
     "command": "openModel.clearApiKey",
     "title": "Open Model: Clear API Key",
     "category": "Open Model"
   }
   ```

2. 在 `extension.ts` 的 `activate` 函数中注册命令：
   ```ts
   context.subscriptions.push(
     vscode.commands.registerCommand('openModel.clearApiKey', async () => {
       const items = PROVIDER_NAMES.map((name) => ({
         label: PROVIDER_METADATA[name].displayName,
         description: name,
       }));

       const pick = await vscode.window.showQuickPick(items, {
         placeHolder: 'Select a provider to clear its API key',
         title: 'Open Model: Clear API Key',
       });

       if (!pick) return;

       const providerName = pick.description as ProviderName;
       await context.secrets.delete(`openModel.${providerName}.apiKey`);
       manager!.setApiKey(providerName, '');
       manager!.notifyAll();
       manager!.logStatus();

       vscode.window.showInformationMessage(
         `Open Model: ${PROVIDER_METADATA[providerName].displayName} API key cleared.`
       );
     })
   );
   ```

## 边界条件

- 用户取消 QuickPick 时不执行任何操作
- 清除不存在的 key 时不报错（幂等操作）
- 清除后需将内存缓存中的 key 设为空字符串（`setApiKey(name, '')`）
- 清除后需触发 `notifyAll` 和 `logStatus` 刷新状态

## 测试用例

1. 命令面板中可找到 "Open Model: Clear API Key"
2. 选择 provider 后，SecretStorage 中对应 key 被删除
3. 内存缓存中对应 key 被清空
4. 取消选择时不执行删除操作

## 验收要求

- [ ] `package.json` 中注册了 `openModel.clearApiKey` 命令
- [ ] 命令执行后 SecretStorage 中对应 key 被删除
- [ ] 命令执行后内存缓存中对应 key 被清空
- [ ] `npm run compile` 通过
