# T043 - 在 extension.ts 中接入自动刷新和手动刷新命令

**优先级:** P3 - 自动模型发现
**依赖:** T041 (refreshProviderModels 方法), T042 (命令注册)

## 需要修改/增加的内容

### 修改文件

- `src/extension.ts` — 添加启动时自动刷新逻辑和手动刷新命令 handler

### 具体变更

#### 1. 启动时自动刷新（fire-and-forget）

在 `activate` 函数中，`manager.registerAll()` 之后添加：

```ts
// Fire-and-forget: refresh models from API for enabled providers with API keys
for (const name of PROVIDER_NAMES) {
  const enabled = vscode.workspace.getConfiguration(`openModel.${name}`).get<boolean>('enabled', false);
  if (enabled && manager.getApiKey(name)) {
    manager.refreshProviderModels(name).catch(() => { /* silent */ });
  }
}
```

#### 2. 手动刷新命令 handler

在命令注册区域添加：

```ts
context.subscriptions.push(
  vscode.commands.registerCommand('openModel.refreshModels', async () => {
    const refreshing: string[] = [];
    for (const name of PROVIDER_NAMES) {
      const enabled = vscode.workspace.getConfiguration(`openModel.${name}`).get<boolean>('enabled', false);
      if (enabled && manager!.getApiKey(name)) {
        refreshing.push(PROVIDER_METADATA[name].displayName);
        manager!.refreshProviderModels(name).catch(() => { /* silent */ });
      }
    }
    if (refreshing.length > 0) {
      vscode.window.showInformationMessage(
        `Open Model: Refreshing models for ${refreshing.join(', ')}...`
      );
    } else {
      vscode.window.showInformationMessage(
        'Open Model: No enabled providers with API keys to refresh.'
      );
    }
  })
);
```

## 边界条件

- 启动刷新为 fire-and-forget：使用 `.catch(() => {})` 吞掉异常，不阻塞 `activate` 返回
- 仅对 `enabled === true` 且有 API Key 的 provider 执行刷新
- 手动刷新命令同样仅刷新符合条件的 provider
- 无任何符合条件的 provider 时显示友好提示
- 启动刷新不需要通知用户（静默进行）
- `refreshProviderModels` 内部失败已由 T041 处理（写日志不抛异常），外层 catch 为双保险

## 测试用例

1. 启动时有 1 个 enabled + keyed provider → 该 provider 自动触发刷新
2. 启动时所有 provider 未启用 → 不触发任何刷新
3. 启动时 provider enabled 但无 API key → 不触发刷新
4. 手动命令 → 对所有符合条件的 provider 触发刷新，显示通知
5. 手动命令时无符合条件的 provider → 显示 "No enabled providers" 提示
6. 刷新过程中 API 失败 → activate 不报错，Extension Host 正常运行

## 验收要求

- [ ] `activate` 函数中对符合条件的 provider 执行 fire-and-forget 刷新
- [ ] `openModel.refreshModels` 命令 handler 已注册
- [ ] 刷新失败不影响 extension 激活
- [ ] `npm run compile` 通过
