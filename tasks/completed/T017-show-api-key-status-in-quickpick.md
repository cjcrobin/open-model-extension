# T017 - 在 Set API Key QuickPick 中显示配置状态

**优先级:** P2 - API Key 管理
**依赖:** T016 (清除 API Key 命令)

## 需要修改/增加的内容

### 修改文件

- `src/extension.ts` — 修改 `openModel.setApiKey` 命令中的 QuickPick items

### 具体变更

修改 setApiKey 命令中构建 QuickPick items 的逻辑，增加 `detail` 或 `description` 显示当前 key 状态：

```ts
const items = PROVIDER_NAMES.map((name) => {
  const hasKey = !!manager!.getApiKey(name); // 需要先在 manager 中暴露 getApiKey 为 public
  const keyStatus = hasKey ? 'API key configured' : 'No API key set';
  const enabled = vscode.workspace.getConfiguration(`openModel.${name}`).get<boolean>('enabled', false);
  const enabledStatus = enabled ? 'Enabled' : 'Disabled';

  return {
    label: PROVIDER_METADATA[name].displayName,
    description: name,
    detail: `${enabledStatus} · ${keyStatus}`,
  };
});
```

### 额外变更

- `src/manager.ts` — 将 `getApiKey` 方法从 `private` 改为 `public`（或新增一个 public 方法 `hasApiKey(name: ProviderName): boolean`）

## 边界条件

- `getApiKey` 或 `hasApiKey` 仅返回内存缓存状态，不查询 SecretStorage
- 状态显示为纯文本，不包含实际 key 内容（安全考虑）
- 如果 provider 未启用但已配置 key，仍显示 "API key configured"

## 测试用例

1. 已配置 key 的 provider → detail 显示 "Enabled · API key configured"
2. 未配置 key 的 provider → detail 显示 "Disabled · No API key set"
3. 已启用但未配置 key → detail 显示 "Enabled · No API key set"
4. 已配置 key 但未启用 → detail 显示 "Disabled · API key configured"

## 验收要求

- [ ] QuickPick 每个选项的 detail 行显示 enabled 状态和 API key 状态
- [ ] `manager.ts` 中 `hasApiKey` 方法为 public
- [ ] 不泄露实际 API key 内容
- [ ] `npm run compile` 通过
